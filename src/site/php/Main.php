<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

require_once __DIR__ . '/GoogleApi.php';
require_once __DIR__ . '/LockedFile.php';
require_once __DIR__ . '/Utils.php';

class Main {

   private const componentName = 'com_giessereigoogle';

   private array   $config;                                // config file content
   private ?string $cacheDir;
   private string  $staticUrlBase;                         // URL base for static files
   private ?object $googleApi = null;

   private string  $rootFolderId;
   private string  $rootFolderDisplayName;

   public function __construct() {
      $this->readConfigFile();
      $this->cacheDir = $this->config['cacheDir'] ?? null;
      $this->staticUrlBase = '/' . \Joomla\CMS\Uri\Uri::root(true) . 'components/' . self::componentName . '/'; }

   private function readConfigFile() : void {
      $homeDir = getenv("HOME");
      $configFileName = $homeDir . '/etc/giessereiGoogleJoomlaExtension.json';
      $configFileText = file_get_contents($configFileName);
      if ($configFileText === false) {
         throw new \Exception('Error while reading config file.'); }
      $this->config = json_decode($configFileText, true);
      if (!$this->config) {
         throw new \Exception('Unable to decode config file.'); }}

   private function performAccessTokenCaching (string $accessTokenCacheName) : void {
      if (!$this->cacheDir) {
         return; }
      assert(!!$this->googleApi);                                              // (for linter)
      $accessTokenCacheFileName = $this->cacheDir . '/' . self::componentName . '_accessToken_' . $accessTokenCacheName . '.json';
      $accessTokenCacheFile = new LockedFile();
      try {
         $accessTokenCacheFile->open($accessTokenCacheFileName);
         $oldTokenInfo = $accessTokenCacheFile->loadJson();
         $remainingSecs = GoogleApi::getAccessTokenRemainingSecs($oldTokenInfo);
         if ($remainingSecs > 900 && $remainingSecs < 6000) {                  // note: in the web browser app, the minimum acceptable remaining time must be significantly lower than here
            $this->googleApi->setAccessTokenInfo($oldTokenInfo);
            return; }
         $newTokenInfo = $this->googleApi->getAccessTokenInfo();
         $accessTokenCacheFile->storeJson($newTokenInfo); }
       finally {
         $accessTokenCacheFile->close(); }}

   private function getGoogleApi() : object {
      if ($this->googleApi) {
         return $this->googleApi; }
      // Provisional logic only for read-only access to Google Drive.
      $authScopes = GoogleApi::authScopesDriveReadOnly;
      $accessTokenCacheName = 'DriveReadOnly';
      $this->googleApi = new GoogleApi($authScopes, $this->config);
      $this->performAccessTokenCaching($accessTokenCacheName);
      assert(!!$this->googleApi);                                              // (for PHPStan linter)
      return $this->googleApi; }

   public function processSiteRequest() : void {
      $viewName = Utils::getViewName();
      switch ($viewName) {
         case 'drive': {
            $this->processDriveRequest();
            break; }
         case 'folder': {
            $this->processFolderRequest();
            break; }
         default: {
            throw new \Exception("Unsupported view name \"$viewName\"-"); }}}

   private function processDriveRequest() : void {
      $this->rootFolderId = '0';                                               // dummy ID for all shared drive folders
      $this->processDirectoryOrFileRequest(); }

   private function processFolderRequest() : void {
      $this->rootFolderId = Utils::getUrlParm('rootFolderId', 'undefRootFolderId');
      $this->processDirectoryOrFileRequest(); }

   private function processDirectoryOrFileRequest() : void {
      $this->verifyUserIsLoggedIn();
      $this->rootFolderDisplayName = Utils::getUrlParm('rootFolderDisplayName', 'undefRootFolderDisplayName');
      $path = Utils::getUrlPathParm();
      if (str_ends_with($path, '/')) {
         $this->generateDirectoryPage($path); }
       else {
         $this->downloadFile($path); }}

   private function generateDirectoryPage (string $path) : void {
      $googleApi = $this->getGoogleApi();
      $accessTokenInfo = $googleApi->getAccessTokenInfo();
      $accessToken = $accessTokenInfo['access_token'];
      $remainingSecs = GoogleApi::getAccessTokenRemainingSecs($accessTokenInfo);
      $jsParms = [
         'view' => 'driveListing',
         'path' => $path,
         'rootFolderId' => $this->rootFolderId,
         'rootFolderDisplayName' => $this->rootFolderDisplayName,
         'driveUrlBase' => Utils::getUrlBasePath(),
         'staticUrlBase' => $this->staticUrlBase,
         'googleAccessToken' => $accessToken,
         'googleAccessTokenSecs' => $remainingSecs ];
      $this->prepareJoomlaDocumentObject($jsParms);
      echo '<div id="gge_content">(wird geladen)</div>'; }

   private function prepareJoomlaDocumentObject (array $jsParms) : void {
      $app = \JFactory::getApplication();
      $document = $app->getDocument();
      $document->addStyleSheet($this->staticUrlBase . 'app.css');
      $document->addScript($this->staticUrlBase . 'app.js');
      $document->addScriptOptions(self::componentName, $jsParms); }

   private function downloadFile (string $path) : void {
      $googleApi = $this->getGoogleApi();
      $pathSegs =& Utils::splitPath($path);
      $file = $googleApi->findPath($this->rootFolderId, $pathSegs);
      if (!$file) {
         throw new \Exception("Path \"$path\" not found."); }
      $isShortcut = Utils::isMimeTypeShortcut($file['mimeType']);
      $fileId = $isShortcut ? $file['targetId'] : $file['id'];
      $mimeType = $isShortcut ? $file['targetMimeType'] : $file['mimeType'];
      if (Utils::isMimeTypeDirectory($mimeType)) {
         $this->generateDirectoryPage($path);                                  // fallback to directory page
         return; }
      $range = isset($_SERVER['HTTP_RANGE']) ? $_SERVER['HTTP_RANGE'] : null; // TODO: Test
      if (Utils::isMimeTypeGoogleDoc($mimeType)) {
         $formatCode = Utils::getUrlParm('fmt', 'pdf');
         $exportMimeType = Utils::getMimeTypeFromFormatCode($formatCode);
         $googleApi->downloadDocFile($fileId, $range, $exportMimeType); }
       else {
         $googleApi->downloadDriveFile($fileId, $range); }
      flush();
      exit(0); }

   private function verifyUserIsLoggedIn() : void {
      $user = \JFactory::getUser();
      if ($user->guest) {
         throw new \Exception('Joomla user is not logged in.'); }}

   }
