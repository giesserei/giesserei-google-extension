<?php
namespace Giesserei\Google;
defined('_JEXEC') or die;

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/php/Main.php';
$main = new Main();
$main->processSiteRequest();
