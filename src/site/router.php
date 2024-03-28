<?php
// Dummy router.

use Joomla\CMS\Component\Router\RouterInterface;

defined('_JEXEC') or die;

class GiessereigoogleRouter implements RouterInterface {

   public function preprocess ($query) {
      return $query; }

   public function build (&$query) {
      return []; }

   public function parse (&$segments) {
      $segments = [];               // this is necessary to allow additional URL segments as parameters for the component (for Joomla >= 4)
      return []; }

   }
