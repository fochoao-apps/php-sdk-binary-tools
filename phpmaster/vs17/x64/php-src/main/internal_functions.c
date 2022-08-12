/*
   +----------------------------------------------------------------------+
   | Copyright (c) The PHP Group                                          |
   +----------------------------------------------------------------------+
   | This source file is subject to version 3.01 of the PHP license,      |
   | that is bundled with this package in the file LICENSE, and is        |
   | available through the world-wide-web at the following url:           |
   | https://www.php.net/license/3_01.txt                                 |
   | If you did not receive a copy of the PHP license and are unable to   |
   | obtain it through the world-wide-web, please send a note to          |
   | license@php.net so we can mail you a copy immediately.               |
   +----------------------------------------------------------------------+
   | Authors: Andi Gutmans <andi@php.net>                                 |
   |          Zeev Suraski <zeev@php.net>                                 |
   +----------------------------------------------------------------------+
 */

#include "php.h"
#include "php_main.h"
#include "zend_modules.h"
#include "zend_compile.h"
#include <stdarg.h>
#include <stdlib.h>
#include <stdio.h>

#include "ext\date/php_date.h"
#include "ext\filter/php_filter.h"
#include "ext\hash/php_hash.h"
#include "ext\iconv/php_iconv.h"
#include "ext\json/php_json.h"
#include "ext\mbstring/mbstring.h"
#include "ext\mysqlnd/php_mysqlnd.h"
#include "ext\pcre/php_pcre.h"
#include "ext\reflection/php_reflection.h"
#include "ext\session/php_session.h"
#include "ext\sockets/php_sockets.h"
#include "ext\spl/php_spl.h"
#include "ext\standard/php_standard.h"
#include "ext\zend_test/php_test.h"
#include "ext\zlib/php_zlib.h"
#include "ext\libxml/php_libxml.h"
#include "ext\pdo/php_pdo.h"
#include "ext\phar/php_phar.h"


static zend_module_entry * const php_builtin_extensions[] = {
	phpext_date_ptr,
	phpext_filter_ptr,
	phpext_hash_ptr,
	phpext_iconv_ptr,
	phpext_json_ptr,
	phpext_mbstring_ptr,
	phpext_mysqlnd_ptr,
	phpext_pcre_ptr,
	phpext_reflection_ptr,
	phpext_session_ptr,
	phpext_sockets_ptr,
	phpext_spl_ptr,
	phpext_standard_ptr,
	phpext_zend_test_ptr,
	phpext_zlib_ptr,
	phpext_libxml_ptr,
	phpext_pdo_ptr,
	phpext_phar_ptr,

};

#define EXTCOUNT (sizeof(php_builtin_extensions)/sizeof(zend_module_entry *))

PHPAPI int php_register_internal_extensions(void)
{
	return php_register_extensions(php_builtin_extensions, EXTCOUNT);
}
