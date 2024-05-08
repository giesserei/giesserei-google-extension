<?php

use Joomla\CMS\Component\Router\RouterBase;

defined('_JEXEC') or die;

// Inherited properties from RouterBase: $app, $menu.
class GiessereigoogleRouter extends RouterBase {

    public function __construct($app, $menu) {
       parent::__construct($app, $menu); }

   public function preprocess ($query) {
      return $query; }

   public function build (&$query) {
      $segments = [];
      unset($query['view']);
      return $segments; }

   // In Joomla 3.10, parse() is only called when there are additional parameters or segments in the URL.
   public function parse (&$segments) {
      $vars = [];
      $activeMenuItem = $this->menu->getActive();
      if ($activeMenuItem) {
         $vars = array_merge($activeMenuItem->query, $vars); }
      $segments = [];               // this is necessary to allow additional URL segments as parameters for the component (for Joomla >= 4)
      return $vars; }

   }
