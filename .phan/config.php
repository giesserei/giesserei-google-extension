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
   'dead_code_detection' => true,
   'redundant_condition_detection' => true,
   'assume_real_types_for_internal_functions' => true,
   'strict_method_checking' => true,
// 'strict_param_checking' => true,
   'strict_property_checking' => true,
   'strict_return_checking' => true,
   'strict_object_checking' => true,
];
