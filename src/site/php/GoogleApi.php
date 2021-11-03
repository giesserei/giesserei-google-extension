<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

require_once __DIR__ . '/Utils.php';

class GoogleApi {

   public const authScopesDriveReadOnly = ['https://www.googleapis.com/auth/drive.readonly'];

   private array   $config;                                // config file content
   private object  $client;                                // Google API client object
   private ?object $driveService = null;

   public function __construct (array $authScopes, array $config) {
      $this->config = $config;
      $this->loadGoogleApiClientLibrary();
      $this->createGoogleClient($authScopes); }

   private function loadGoogleApiClientLibrary() : void {
      $homeDir = getenv('HOME');
      require_once $homeDir . 'lib/google-api-php-client/vendor/autoload.php'; }

   private function createGoogleClient (array $authScopes) : void {
      $googleApiKey = $this->config['googleApiKey'];
      $impersonationAccount = (string)$this->config['defaultImpersonationAccount'];
      $clientConfig = [
         'use_application_default_credentials' => true,
         'client_id'         => $googleApiKey['client_id'],
         'client_email'      => $googleApiKey['client_email'],
         'signing_key'       => $googleApiKey['private_key'],
         'subject'           => $impersonationAccount,
         'scopes'            => $authScopes,
         'access_type'       => 'offline',
         'application_name'  => 'Giesserei Google Joomla extension' ];
      $this->client = new \Google\Client($clientConfig); }

   public function setAccessTokenInfo (array $tokenInfo) : void {
      $this->client->setAccessToken($tokenInfo); }

   // Returns ['access_token', 'expires_in', 'created'].
   public function getAccessTokenInfo() : array {
      $tokenInfo = $this->client->getAccessToken();
      if (!$tokenInfo || !isSet($tokenInfo['access_token'])) {
         $tokenInfo = $this->client->fetchAccessTokenWithAssertion();
         if (!$tokenInfo || !isSet($tokenInfo['access_token'])) {
            throw new \Exception('Google access token could not be retrieved.'); }}
      return $tokenInfo; }

   public function getAccessToken() : string {
      $tokenInfo = $this->getAccessTokenInfo();
      return $tokenInfo['access_token']; }

   public static function getAccessTokenRemainingSecs (?array $tokenInfo) : float {
      if (!$tokenInfo) {
         return -1; }
      return ($tokenInfo['created'] ?? -1) + ($tokenInfo['expires_in'] ?? -1) - time(); }

   //--- Drive API -------------------------------------------------------------

   private function getDriveService() : object {
      if (!$this->driveService) {
         $this->driveService = new \Google\Service\Drive($this->client); }
      return $this->driveService; }

   // Returns the drive ID or null.
   // See: https://stackoverflow.com/questions/68794842, https://developers.google.com/drive/api/v3/search-shareddrives
   private function findSharedDriveByName_withoutDomainAdminAccess (string $driveName) : ?string {
      $driveService = $this->getDriveService();
      $parms = [
         'pageSize' => '100',
         'q'        => 'hidden = false',
         'fields'   => 'drives(id, name)' ];
      $result = $driveService->drives->listDrives($parms);
      $drives = $result->getDrives();
      foreach ($drives as $drive) {
         if ($drive->getName() == $driveName) {
            return $drive->getId(); }}
      return null; }

   // Returns null if the file is not found.
   private function findFileByName (string $fileName, string $dirId) : ?array {
      $driveService = $this->getDriveService();
      $parms = [
         'corpora'                   => 'allDrives',
         'q'                         => 'name = ' . self::quoted($fileName) . ' and ' . self::quoted($dirId) . ' in parents and trashed = false',
         'fields'                    => 'files(id, mimeType, shortcutDetails/targetId, shortcutDetails/targetMimeType)',
         'includeItemsFromAllDrives' => 'true',
         'supportsAllDrives'         => 'true' ];
      $result = $driveService->files->listFiles($parms);
      $files = $result->getFiles();
      if (!count($files)) {
         return null; }
      $file = $files[0];
      $shortcutDetails = $file->getShortcutDetails();
      return ['id' => $file->getId(), 'mimeType' => $file->getMimeType(), 'targetId' => $shortcutDetails?->getTargetId(), 'targetMimeType' => $shortcutDetails?->getTargetMimeType() ]; }

   // $path is an array of path segments.
   // Returns null if the path is not found.
   public function findPath (array &$path) : ?array {
      if (!$path) {
         return null; }
      $driveName = $path[0];
      $driveId = $this->findSharedDriveByName_withoutDomainAdminAccess($driveName);
      if (!$driveId) {
         return null; }
      if (count($path) == 1) {
         return [
            'id'       => $driveId,                        // root folder ID is drive ID
            'mimeType' => 'application/vnd.google-apps.folder' ]; }
      $dirId = $driveId;
      $file = null;
      for ($i = 1; $i < count($path); $i++) {
         $file = $this->findFileByName($path[$i], $dirId);
         if (!$file) {
            return null; }
         $isShortcut = Utils::isMimeTypeShortcut($file['mimeType']);
         $dirId = $isShortcut ? $file['targetId'] : $file['id']; }
      return $file; }

   public function downloadDriveFile (string $fileId, ?string $range) : void {
      $parms = [
         'alt'               => 'media',
         'supportsAllDrives' => 'true' ];
      $url = 'https://www.googleapis.com/drive/v3/files/' . urlEncode($fileId) . '?' . http_build_query($parms);
      $this->download($url, $range, true); }

   public function downloadDocFile (string $fileId, ?string $range, string $exportMimeType) : void {
      $parms = [
         'mimeType' => $exportMimeType ];
      $url = 'https://www.googleapis.com/drive/v3/files/' . urlEncode($fileId) . '/export?' . http_build_query($parms);
      $this->download($url, $range, false); }

   private function download (string $url, ?string $range, bool $allowRange) : void {
      $accessToken = $this->getAccessToken();
      $headers = [
         'Authorization' => 'Bearer ' . $accessToken ];
      if ($range) {
         $headers['Range'] = $range; }
      $options = [
         'http_errors' => false,
         'stream'      => true,
         'headers'     => $headers ];
      $http = new \GuzzleHttp\Client();
      $response = $http->request('GET', $url, $options);
      $statusCode = $response->getStatusCode();
      $statusReason = $response->getReasonPhrase();
      if ($statusCode >= 400) {
         throw new \Exception('Google API request failed for "' . $url . '", statusCode=' . $statusCode . ' (' . $statusReason . ').'); }
      Utils::stopOutputBuffering();
      http_response_code($statusCode);
      if ($allowRange && !$response->hasHeader('Accept-Ranges')) {
         header('Accept-Ranges: bytes'); }
      $this->forwardDownloadHeaders($response);
      $body = $response->getBody();
      while (!$body->eof()) {
         $data = $body->read(0x4000);
         if ($data === false) {
            throw new \Exception('Timeout while reading from file download stream.'); }
         echo $data; }
      $body->close(); }

   private function forwardDownloadHeaders (object $response) : void {
      $headers = $response->getHeaders();
      foreach ($headers as $name => $values) {
         if ($this->filterDownloadHeader($name)) {
            foreach ($values as $value) {
               header($name . ': ' . $value, false); }}}}

   private function filterDownloadHeader (string $s) : bool {
      switch ($s) {
         case 'Content-Disposition': return false;
         // case 'Content-Length':   return false;
         case 'Set-Cookie':          return false;
         default: return true; }}

   private static function quoted (string $s) : string {
      return '\'' . str_replace('\'', '\\\'', str_replace('\\', '\\\\', $s)) . '\''; }

   }
