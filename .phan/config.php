<?php

return [
   'directory_list' => [
      'src/site',
      '/appl/php/google-api-php-client/src',
      '/appl/php/google-api-php-client/vendor',
   ],
   'exclude_analysis_directory_list' => [
      '/appl/php/google-api-php-client/src',
      '/appl/php/google-api-php-client/vendor',
   ],
   'suppress_issue_types' => [
      'PhanUndeclaredClassMethod',
   ],
   // 'globals_type_map' => [
   'dead_code_detection' => true,
   'redundant_condition_detection' => true,
];
