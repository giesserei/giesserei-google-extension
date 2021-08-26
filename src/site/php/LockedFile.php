<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

class LockedFile {

   private mixed             $fd;
   private string            $fileName;

   public function open (string $fileName) : void {
      $ok = false;
      try {
         $this->fileName = $fileName;
         $this->fd = fopen($fileName, 'c+');
         if (!$this->fd) {
            throw new \Exception("Unable to open file \"$fileName\"."); }
         if (!flock($this->fd, LOCK_EX)) {
            throw new \Exception("Unable to acquire lock on file \"$fileName\"."); }
         $ok = true; }
       finally {
         if (!$ok) {
            $this->close(); }}}

   public function close() : void {
      if (!$this->fd) {
         return; }
      $fd = $this->fd;
      $this->fd = null;
      if (!fclose($fd)) {
         throw new \Exception("Error while closing file \"$this->fileName\"."); }}

   public function load() : string {
      if (!rewind($this->fd)) {
         throw new \Exception("Rewind error for file \"$this->fileName\"."); }
      $buf = '';
      while (!feof($this->fd)) {
         $s = fread($this->fd, 0x10000);
         if ($s === false) {
            break; }
         $buf .= $s; }
      return $buf; }

   public function store (string $s) : void {
      if (!rewind($this->fd)) {
         throw new \Exception("Rewind error for file \"$this->fileName\"."); }
      if (fwrite($this->fd, $s) === false) {
         throw new \Exception("Error while writing to file \"$this->fileName\"."); }
      $fpos = ftell($this->fd);
      if ($fpos === false) {
         throw new \Exception("Unable to get position of file \"$this->fileName\"."); }
      if (!ftruncate($this->fd, $fpos)) {
         throw new \Exception("Unable to truncate file \"$this->fileName\"."); }}

   public function loadJson() : ?array {
      $json = $this->load();
      if (!$json) {
         return null; }
      try {
         return json_decode($json, true, flags: JSON_THROW_ON_ERROR); }
       catch (\Throwable $t) {
         throw new \Exception("Error while decoding JSON content of file \"$this->fileName\" (" . $t->getMessage() . ")."); }}

   public function storeJson (mixed $x) : void {
      $json = json_encode($x, flags: JSON_THROW_ON_ERROR);
      $this->store($json); }

   }
