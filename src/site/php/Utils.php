<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

class Utils {

   public static function getUrlParm (string $parmName, mixed $defaultValue = null, string $filter = 'STRING') : mixed {
      $app = \JFactory::getApplication();
      $input = $app->input;
      return $input->get($parmName, $defaultValue, $filter); }

   // Returns the path parameter without a leading '/'.
   public static function getUrlPathParm() : string {
      $app = \JFactory::getApplication();
      $sitemenu = $app->getMenu();
      $activeMenuItem = $sitemenu->getActive();
      if (!$activeMenuItem) {
         $s = self::getUrlParm('path') ?: '/';
         while (strlen($s) > 1 && $s[0] == '/') {
            $s = substr($s, 1); }
         return $s; }
      $menuLevel = $activeMenuItem->level;
      $uri = \Joomla\CMS\Uri\Uri::getInstance();
      $s = $uri->getPath();
      if (strlen($s) > 1 && $s[0] == '/') {
         $s = substr($s, 1); }
      for ($i = 0; $i < $menuLevel; $i++) {
         $p = strpos($s, '/');
         if ($p === false) {
            $s = '';
            break; }
         $s = substr($s, $p + 1); }
      while (strlen($s) > 1 && $s[0] == '/') {
         $s = substr($s, 1); }
      return $s ?: '/'; }

   private static function decodePathSegment (string $s) : string {
      // Special enoding for slash, because Apache does not allow "%2F" in the URL.
      return rawUrlDecode(str_replace('~2F', '/', $s)); }

   // Splits a path string into path segments.
   public static function & splitPath (string $s) : array {
      $a = [];
      if (!$s || $s == '/') {
         return $a; }
      $sLen = strlen($s);
      $p = 0;
      while ($p < $sLen) {
         $p1 = $p;
         while ($p < $sLen && $s[$p] != '/') {
            $p++; }
         if ($p > $p1) {
            array_push($a, self::decodePathSegment(substr($s, $p1, $p - $p1))); }
         $p++; }
      return $a; }

   public static function isMimeTypeDirectory (string $mimeType) : bool {
      return $mimeType == 'application/vnd.google-apps.folder'; }

   public static function isMimeTypeShortcut (string $mimeType) : bool {
      return $mimeType == 'application/vnd.google-apps.shortcut'; }

   public static function isMimeTypeGoogleDoc (string $mimeType) : bool {
      switch ($mimeType) {
         case 'application/vnd.google-apps.document':     return true;
         case 'application/vnd.google-apps.spreadsheet':  return true;
         case 'application/vnd.google-apps.presentation': return true;
         case 'application/vnd.google-apps.drawing':      return true;
         default:                                         return false; }}

   // Opposite to getFormatCode() in DriveListing.ts.
   public static function getMimeTypeFromFormatCode (string $formatCode) : string {
      switch ($formatCode) {
         // MS Office
         case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
         case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
         case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
         // ODF / Open Office / Libre Office
         case 'odt': return 'application/vnd.oasis.opendocument.text';
         case 'ods': return 'application/vnd.oasis.opendocument.spreadsheet';
         case 'odp': return 'application/vnd.oasis.opendocument.presentation';
         // Other:
         case 'pdf':  return 'application/pdf';
         case 'html': return 'text/html';
         default:     return $formatCode; }}               // fallback

   public static function stopOutputBuffering() : void {
      while (true) {
         if (!ob_get_level()) {
            break; }
         ob_end_clean(); }}

   }
