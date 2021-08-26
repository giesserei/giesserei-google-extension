<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

require_once __DIR__ . '/GoogleApi.php';
require_once __DIR__ . '/Utils.php';

class Main {

   private const componentName = 'com_giessereigoogle';

   private array   $config;                                // config file content
   private string  $staticUrlBase;                         // URL base for static files
   private ?object $googleApi = null;

   public function __construct() {
      $this->readConfigFile();
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

   private function getGoogleApi() : object {
      if (!$this->googleApi) {
         $this->googleApi = new GoogleApi(GoogleApi::authScopesDriveReadOnly, $this->config); }
      return $this->googleApi; }

   public function processSiteRequest() : void {
      $viewName = $this->getViewName();
      switch ($viewName) {
         case 'drive': {
            $this->processDriveRequest();
            break; }
         default: {
            throw new \Exception("Unsupported view name \"$viewName\"-"); }}}

   private function processDriveRequest() : void {
      $this->verifyUserIsLoggedIn();
      $path = Utils::getUrlPathParm();
      if (str_ends_with($path, '/')) {
         $this->generateDirectoryPage($path); }
       else {
         $this->downloadFile($path); }}

   private function generateDirectoryPage (string $path) : void {
      $googleApi = $this->getGoogleApi();
      $accessToken = $googleApi->getAccessToken();
      $jsParms = [
         'view' => 'driveListing',
         'path' => $path,
         'rootFolderDisplayName' => $this->config['rootFolderDisplayName'],
         'driveUrlBase' => $this->config['driveUrlBase'],
         'staticUrlBase' => $this->staticUrlBase,
         'googleAccessToken' => $accessToken ];
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
      $file = $googleApi->findPath($pathSegs);
      if (!$file) {
         throw new \Exception("Path \"$path\" not found."); }
      $fileId = $file['id'];
      $mimeType = $file['mimeType'];
      if (Utils::isMimeTypeDirectory($mimeType)) {
         $this->generateDirectoryPage($path);              // fallback to directory page
         return; }
      if (Utils::isMimeTypeRedirect($mimeType)) {
         throw new \Exception('Google Drive redirect not yet implemented.'); }
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

   private function getViewName() : ?string {
      $inputView = Utils::getUrlParm('view');              // is undefined with SEF and additional URL segments
      $app = \JFactory::getApplication();
      $sitemenu = $app->getMenu();
      $activeMenuItem = $sitemenu->getActive();            // may be null
      $menuView = $activeMenuItem?->query['view'];
      $viewName = $inputView ?? $menuView;
      return $viewName; }

   }
