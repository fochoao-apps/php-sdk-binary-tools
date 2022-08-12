/* Generated by re2c 1.1.1 */
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
  | Author: Jakub Zelenka <bukka@php.net>                                |
  +----------------------------------------------------------------------+
*/

#include "php.h"
#include "php_json_scanner.h"
#include "php_json_scanner_defs.h"
#include "php_json_parser.h"
#include "json_parser.tab.h"

#define	YYCTYPE     php_json_ctype
#define	YYCURSOR    s->cursor
#define	YYLIMIT     s->limit
#define	YYMARKER    s->marker
#define	YYCTXMARKER s->ctxmarker

#define YYGETCONDITION()        s->state
#define YYSETCONDITION(yystate) s->state = yystate

#define	YYFILL(n)

#define PHP_JSON_CONDITION_SET(condition) YYSETCONDITION(yyc##condition)
#define PHP_JSON_CONDITION_GOTO(condition) goto yyc_##condition
#define PHP_JSON_CONDITION_SET_AND_GOTO(condition) \
	PHP_JSON_CONDITION_SET(condition); \
	PHP_JSON_CONDITION_GOTO(condition)
#define PHP_JSON_CONDITION_GOTO_STR_P2() \
	do { \
		if (s->utf8_invalid) { \
			PHP_JSON_CONDITION_GOTO(STR_P2_BIN); \
		} else { \
			PHP_JSON_CONDITION_GOTO(STR_P2_UTF); \
		} \
	} while(0)


#define PHP_JSON_SCANNER_COPY_ESC() php_json_scanner_copy_string(s, 0)
#define PHP_JSON_SCANNER_COPY_UTF() php_json_scanner_copy_string(s, 5)
#define PHP_JSON_SCANNER_COPY_UTF_SP() php_json_scanner_copy_string(s, 11)

#define PHP_JSON_INT_MAX_LENGTH (MAX_LENGTH_OF_LONG - 1)


static void php_json_scanner_copy_string(php_json_scanner *s, int esc_size)
{
	size_t len = s->cursor - s->str_start - esc_size - 1;
	if (len) {
		memcpy(s->pstr, s->str_start, len);
		s->pstr += len;
	}
}

static int php_json_hex_to_int(char code)
{
	if (code >= '0' && code <= '9') {
		return code - '0';
	} else if (code >= 'A' && code <= 'F') {
		return code - ('A' - 10);
	} else if (code >= 'a' && code <= 'f') {
		return code - ('a' - 10);
	} else {
		/* this should never happened (just to suppress compiler warning) */
		return -1;
	}
}

static int php_json_ucs2_to_int_ex(php_json_scanner *s, int size, int start)
{
	int i, code = 0;
	php_json_ctype *pc = s->cursor - start;
	for (i = 0; i < size; i++) {
		code |= php_json_hex_to_int(*(pc--)) << (i * 4);
	}
	return code;
}

static int php_json_ucs2_to_int(php_json_scanner *s, int size)
{
	return php_json_ucs2_to_int_ex(s, size, 1);
}

void php_json_scanner_init(php_json_scanner *s, const char *str, size_t str_len, int options)
{
	s->cursor = (php_json_ctype *) str;
	s->limit = (php_json_ctype *) str + str_len;
	s->options = options;
	PHP_JSON_CONDITION_SET(JS);
}

int php_json_scan(php_json_scanner *s)
{
	ZVAL_NULL(&s->value);

std:
	s->token = s->cursor;


	{
		YYCTYPE yych;
		unsigned int yyaccept = 0;
		if (YYGETCONDITION() < 2) {
			if (YYGETCONDITION() < 1) {
				goto yyc_JS;
			} else {
				goto yyc_STR_P1;
			}
		} else {
			if (YYGETCONDITION() < 3) {
				goto yyc_STR_P2_BIN;
			} else {
				goto yyc_STR_P2_UTF;
			}
		}
/* *********************************** */
yyc_JS:
		{
			static const unsigned char yybm[] = {
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,  64,   0,   0,   0,  64,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				 64,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				128, 128, 128, 128, 128, 128, 128, 128, 
				128, 128,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
				  0,   0,   0,   0,   0,   0,   0,   0, 
			};
			yych = *YYCURSOR;
			if (yych <= ']') {
				if (yych <= '"') {
					if (yych <= '\f') {
						if (yych <= 0x08) {
							if (yych >= 0x01) goto yy5;
						} else {
							if (yych <= '\t') goto yy7;
							if (yych <= '\n') goto yy10;
							goto yy5;
						}
					} else {
						if (yych <= 0x1F) {
							if (yych <= '\r') goto yy11;
							goto yy5;
						} else {
							if (yych <= ' ') goto yy7;
							if (yych <= '!') goto yy12;
							goto yy14;
						}
					}
				} else {
					if (yych <= '0') {
						if (yych <= ',') {
							if (yych <= '+') goto yy12;
							goto yy16;
						} else {
							if (yych <= '-') goto yy18;
							if (yych <= '/') goto yy12;
							goto yy19;
						}
					} else {
						if (yych <= 'Z') {
							if (yych <= '9') goto yy21;
							if (yych <= ':') goto yy23;
							goto yy12;
						} else {
							if (yych <= '[') goto yy25;
							if (yych <= '\\') goto yy12;
							goto yy27;
						}
					}
				}
			} else {
				if (yych <= '}') {
					if (yych <= 's') {
						if (yych <= 'f') {
							if (yych <= 'e') goto yy12;
							goto yy29;
						} else {
							if (yych == 'n') goto yy30;
							goto yy12;
						}
					} else {
						if (yych <= 'z') {
							if (yych <= 't') goto yy31;
							goto yy12;
						} else {
							if (yych <= '{') goto yy32;
							if (yych <= '|') goto yy12;
							goto yy34;
						}
					}
				} else {
					if (yych <= 0xEC) {
						if (yych <= 0xC1) {
							if (yych <= 0x7F) goto yy12;
							goto yy36;
						} else {
							if (yych <= 0xDF) goto yy38;
							if (yych <= 0xE0) goto yy39;
							goto yy40;
						}
					} else {
						if (yych <= 0xF0) {
							if (yych <= 0xED) goto yy41;
							if (yych <= 0xEF) goto yy40;
							goto yy42;
						} else {
							if (yych <= 0xF3) goto yy43;
							if (yych <= 0xF4) goto yy44;
							goto yy36;
						}
					}
				}
			}
			++YYCURSOR;
			{
		if (s->limit < s->cursor) {
			return PHP_JSON_T_EOI;
		} else {
			s->errcode = PHP_JSON_ERROR_CTRL_CHAR;
			return PHP_JSON_T_ERROR;
		}
	}
yy5:
			++YYCURSOR;
			{
		s->errcode = PHP_JSON_ERROR_CTRL_CHAR;
		return PHP_JSON_T_ERROR;
	}
yy7:
			yych = *++YYCURSOR;
yy8:
			if (yybm[0+yych] & 64) {
				goto yy7;
			}
yy9:
			{ goto std; }
yy10:
			++YYCURSOR;
			goto yy9;
yy11:
			yych = *++YYCURSOR;
			if (yych == '\n') goto yy10;
			goto yy8;
yy12:
			++YYCURSOR;
yy13:
			{
		s->errcode = PHP_JSON_ERROR_SYNTAX;
		return PHP_JSON_T_ERROR;
	}
yy14:
			++YYCURSOR;
			{
		s->str_start = s->cursor;
		s->str_esc = 0;
		s->utf8_invalid = 0;
		s->utf8_invalid_count = 0;
		PHP_JSON_CONDITION_SET_AND_GOTO(STR_P1);
	}
yy16:
			++YYCURSOR;
			{ return ','; }
yy18:
			yych = *++YYCURSOR;
			if (yych <= '/') goto yy13;
			if (yych <= '0') goto yy19;
			if (yych <= '9') goto yy21;
			goto yy13;
yy19:
			yyaccept = 0;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 'D') {
				if (yych == '.') goto yy45;
			} else {
				if (yych <= 'E') goto yy47;
				if (yych == 'e') goto yy47;
			}
yy20:
			{
		bool bigint = 0, negative = s->token[0] == '-';
		size_t digits = (size_t) (s->cursor - s->token - negative);
		if (digits >= PHP_JSON_INT_MAX_LENGTH) {
			if (digits == PHP_JSON_INT_MAX_LENGTH) {
				int cmp = strncmp((char *) (s->token + negative), LONG_MIN_DIGITS, PHP_JSON_INT_MAX_LENGTH);
				if (!(cmp < 0 || (cmp == 0 && negative))) {
					bigint = 1;
				}
			} else {
				bigint = 1;
			}
		}
		if (!bigint) {
			ZVAL_LONG(&s->value, ZEND_STRTOL((char *) s->token, NULL, 10));
			return PHP_JSON_T_INT;
		} else if (s->options & PHP_JSON_BIGINT_AS_STRING) {
			ZVAL_STRINGL(&s->value, (char *) s->token, s->cursor - s->token);
			return PHP_JSON_T_STRING;
		} else {
			ZVAL_DOUBLE(&s->value, zend_strtod((char *) s->token, NULL));
			return PHP_JSON_T_DOUBLE;
		}
	}
yy21:
			yyaccept = 0;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yybm[0+yych] & 128) {
				goto yy21;
			}
			if (yych <= 'D') {
				if (yych == '.') goto yy45;
				goto yy20;
			} else {
				if (yych <= 'E') goto yy47;
				if (yych == 'e') goto yy47;
				goto yy20;
			}
yy23:
			++YYCURSOR;
			{ return ':'; }
yy25:
			++YYCURSOR;
			{ return '['; }
yy27:
			++YYCURSOR;
			{ return ']'; }
yy29:
			yyaccept = 1;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych == 'a') goto yy48;
			goto yy13;
yy30:
			yyaccept = 1;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych == 'u') goto yy49;
			goto yy13;
yy31:
			yyaccept = 1;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych == 'r') goto yy50;
			goto yy13;
yy32:
			++YYCURSOR;
			{ return '{'; }
yy34:
			++YYCURSOR;
			{ return '}'; }
yy36:
			++YYCURSOR;
yy37:
			{
		s->errcode = PHP_JSON_ERROR_UTF8;
		return PHP_JSON_T_ERROR;
	}
yy38:
			yych = *++YYCURSOR;
			if (yych <= 0x7F) goto yy37;
			if (yych <= 0xBF) goto yy12;
			goto yy37;
yy39:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x9F) goto yy37;
			if (yych <= 0xBF) goto yy51;
			goto yy37;
yy40:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x7F) goto yy37;
			if (yych <= 0xBF) goto yy51;
			goto yy37;
yy41:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x7F) goto yy37;
			if (yych <= 0x9F) goto yy51;
			goto yy37;
yy42:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x8F) goto yy37;
			if (yych <= 0xBF) goto yy52;
			goto yy37;
yy43:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x7F) goto yy37;
			if (yych <= 0xBF) goto yy52;
			goto yy37;
yy44:
			yyaccept = 2;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 0x7F) goto yy37;
			if (yych <= 0x8F) goto yy52;
			goto yy37;
yy45:
			yych = *++YYCURSOR;
			if (yych <= '/') goto yy46;
			if (yych <= '9') goto yy53;
yy46:
			YYCURSOR = YYMARKER;
			if (yyaccept <= 1) {
				if (yyaccept == 0) {
					goto yy20;
				} else {
					goto yy13;
				}
			} else {
				if (yyaccept == 2) {
					goto yy37;
				} else {
					goto yy55;
				}
			}
yy47:
			yych = *++YYCURSOR;
			if (yych <= ',') {
				if (yych == '+') goto yy56;
				goto yy46;
			} else {
				if (yych <= '-') goto yy56;
				if (yych <= '/') goto yy46;
				if (yych <= '9') goto yy57;
				goto yy46;
			}
yy48:
			yych = *++YYCURSOR;
			if (yych == 'l') goto yy59;
			goto yy46;
yy49:
			yych = *++YYCURSOR;
			if (yych == 'l') goto yy60;
			goto yy46;
yy50:
			yych = *++YYCURSOR;
			if (yych == 'u') goto yy61;
			goto yy46;
yy51:
			yych = *++YYCURSOR;
			if (yych <= 0x7F) goto yy46;
			if (yych <= 0xBF) goto yy12;
			goto yy46;
yy52:
			yych = *++YYCURSOR;
			if (yych <= 0x7F) goto yy46;
			if (yych <= 0xBF) goto yy51;
			goto yy46;
yy53:
			yyaccept = 3;
			yych = *(YYMARKER = ++YYCURSOR);
			if (yych <= 'D') {
				if (yych <= '/') goto yy55;
				if (yych <= '9') goto yy53;
			} else {
				if (yych <= 'E') goto yy47;
				if (yych == 'e') goto yy47;
			}
yy55:
			{
		ZVAL_DOUBLE(&s->value, zend_strtod((char *) s->token, NULL));
		return PHP_JSON_T_DOUBLE;
	}
yy56:
			yych = *++YYCURSOR;
			if (yych <= '/') goto yy46;
			if (yych >= ':') goto yy46;
yy57:
			yych = *++YYCURSOR;
			if (yych <= '/') goto yy55;
			if (yych <= '9') goto yy57;
			goto yy55;
yy59:
			yych = *++YYCURSOR;
			if (yych == 's') goto yy62;
			goto yy46;
yy60:
			yych = *++YYCURSOR;
			if (yych == 'l') goto yy63;
			goto yy46;
yy61:
			yych = *++YYCURSOR;
			if (yych == 'e') goto yy65;
			goto yy46;
yy62:
			yych = *++YYCURSOR;
			if (yych == 'e') goto yy67;
			goto yy46;
yy63:
			++YYCURSOR;
			{
		ZVAL_NULL(&s->value);
		return PHP_JSON_T_NUL;
	}
yy65:
			++YYCURSOR;
			{
		ZVAL_TRUE(&s->value);
		return PHP_JSON_T_TRUE;
	}
yy67:
			++YYCURSOR;
			{
		ZVAL_FALSE(&s->value);
		return PHP_JSON_T_FALSE;
	}
		}
/* *********************************** */
yyc_STR_P1:
		yych = *YYCURSOR;
		if (yych <= 0xDF) {
			if (yych <= '[') {
				if (yych <= 0x1F) goto yy71;
				if (yych == '"') goto yy75;
				goto yy73;
			} else {
				if (yych <= '\\') goto yy77;
				if (yych <= 0x7F) goto yy73;
				if (yych <= 0xC1) goto yy79;
				goto yy81;
			}
		} else {
			if (yych <= 0xEF) {
				if (yych <= 0xE0) goto yy82;
				if (yych == 0xED) goto yy84;
				goto yy83;
			} else {
				if (yych <= 0xF0) goto yy85;
				if (yych <= 0xF3) goto yy86;
				if (yych <= 0xF4) goto yy87;
				goto yy79;
			}
		}
yy71:
		++YYCURSOR;
		{
		s->errcode = PHP_JSON_ERROR_CTRL_CHAR;
		return PHP_JSON_T_ERROR;
	}
yy73:
		++YYCURSOR;
		{ PHP_JSON_CONDITION_GOTO(STR_P1); }
yy75:
		++YYCURSOR;
		{
		zend_string *str;
		size_t len = s->cursor - s->str_start - s->str_esc - 1 + s->utf8_invalid_count;
		if (len == 0) {
			PHP_JSON_CONDITION_SET(JS);
			ZVAL_EMPTY_STRING(&s->value);
			return PHP_JSON_T_ESTRING;
		}
		str = zend_string_alloc(len, 0);
		ZSTR_VAL(str)[len] = '\0';
		ZVAL_STR(&s->value, str);
		if (s->str_esc || s->utf8_invalid) {
			s->pstr = (php_json_ctype *) Z_STRVAL(s->value);
			s->cursor = s->str_start;
			PHP_JSON_CONDITION_GOTO_STR_P2();
		} else {
			memcpy(Z_STRVAL(s->value), s->str_start, len);
			PHP_JSON_CONDITION_SET(JS);
			return PHP_JSON_T_STRING;
		}
	}
yy77:
		yyaccept = 0;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 'e') {
			if (yych <= '/') {
				if (yych == '"') goto yy88;
				if (yych >= '/') goto yy88;
			} else {
				if (yych <= '\\') {
					if (yych >= '\\') goto yy88;
				} else {
					if (yych == 'b') goto yy88;
				}
			}
		} else {
			if (yych <= 'q') {
				if (yych <= 'f') goto yy88;
				if (yych == 'n') goto yy88;
			} else {
				if (yych <= 's') {
					if (yych <= 'r') goto yy88;
				} else {
					if (yych <= 't') goto yy88;
					if (yych <= 'u') goto yy90;
				}
			}
		}
yy78:
		{
		s->errcode = PHP_JSON_ERROR_SYNTAX;
		return PHP_JSON_T_ERROR;
	}
yy79:
		++YYCURSOR;
yy80:
		{
		if (s->options & (PHP_JSON_INVALID_UTF8_IGNORE | PHP_JSON_INVALID_UTF8_SUBSTITUTE)) {
			if (s->options & PHP_JSON_INVALID_UTF8_SUBSTITUTE) {
				if (s->utf8_invalid_count > INT_MAX - 2) {
					s->errcode = PHP_JSON_ERROR_UTF8;
					return PHP_JSON_T_ERROR;
				}
				s->utf8_invalid_count += 2;
			} else {
				s->utf8_invalid_count--;
			}
			s->utf8_invalid = 1;
			PHP_JSON_CONDITION_GOTO(STR_P1);
		}
		s->errcode = PHP_JSON_ERROR_UTF8;
		return PHP_JSON_T_ERROR;
	}
yy81:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy80;
		if (yych <= 0xBF) goto yy73;
		goto yy80;
yy82:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x9F) goto yy80;
		if (yych <= 0xBF) goto yy92;
		goto yy80;
yy83:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy80;
		if (yych <= 0xBF) goto yy92;
		goto yy80;
yy84:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy80;
		if (yych <= 0x9F) goto yy92;
		goto yy80;
yy85:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x8F) goto yy80;
		if (yych <= 0xBF) goto yy93;
		goto yy80;
yy86:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy80;
		if (yych <= 0xBF) goto yy93;
		goto yy80;
yy87:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy80;
		if (yych <= 0x8F) goto yy93;
		goto yy80;
yy88:
		++YYCURSOR;
		{
		s->str_esc++;
		PHP_JSON_CONDITION_GOTO(STR_P1);
	}
yy90:
		yych = *++YYCURSOR;
		if (yych <= 'D') {
			if (yych <= '9') {
				if (yych <= '/') goto yy91;
				if (yych <= '0') goto yy94;
				goto yy95;
			} else {
				if (yych <= '@') goto yy91;
				if (yych <= 'C') goto yy95;
				goto yy96;
			}
		} else {
			if (yych <= 'c') {
				if (yych <= 'F') goto yy95;
				if (yych >= 'a') goto yy95;
			} else {
				if (yych <= 'd') goto yy96;
				if (yych <= 'f') goto yy95;
			}
		}
yy91:
		YYCURSOR = YYMARKER;
		if (yyaccept <= 1) {
			if (yyaccept == 0) {
				goto yy78;
			} else {
				goto yy80;
			}
		} else {
			goto yy114;
		}
yy92:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy91;
		if (yych <= 0xBF) goto yy73;
		goto yy91;
yy93:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy91;
		if (yych <= 0xBF) goto yy92;
		goto yy91;
yy94:
		yych = *++YYCURSOR;
		if (yych <= '9') {
			if (yych <= '/') goto yy91;
			if (yych <= '0') goto yy97;
			if (yych <= '7') goto yy98;
			goto yy99;
		} else {
			if (yych <= 'F') {
				if (yych <= '@') goto yy91;
				goto yy99;
			} else {
				if (yych <= '`') goto yy91;
				if (yych <= 'f') goto yy99;
				goto yy91;
			}
		}
yy95:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy99;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy99;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy99;
			goto yy91;
		}
yy96:
		yych = *++YYCURSOR;
		if (yych <= 'B') {
			if (yych <= '7') {
				if (yych <= '/') goto yy91;
				goto yy99;
			} else {
				if (yych <= '9') goto yy100;
				if (yych <= '@') goto yy91;
				goto yy100;
			}
		} else {
			if (yych <= '`') {
				if (yych <= 'F') goto yy101;
				goto yy91;
			} else {
				if (yych <= 'b') goto yy100;
				if (yych <= 'f') goto yy101;
				goto yy91;
			}
		}
yy97:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '7') goto yy102;
			if (yych <= '9') goto yy103;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy103;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy103;
			goto yy91;
		}
yy98:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy103;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy103;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy103;
			goto yy91;
		}
yy99:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy104;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy104;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy104;
			goto yy91;
		}
yy100:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy105;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy105;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy105;
			goto yy91;
		}
yy101:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy106;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy106;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy106;
			goto yy91;
		}
yy102:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy107;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy107;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy107;
			goto yy91;
		}
yy103:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy109;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy109;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy109;
			goto yy91;
		}
yy104:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy111;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy111;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy111;
			goto yy91;
		}
yy105:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy113;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy113;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy113;
			goto yy91;
		}
yy106:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych <= '9') goto yy115;
			goto yy91;
		} else {
			if (yych <= 'F') goto yy115;
			if (yych <= '`') goto yy91;
			if (yych <= 'f') goto yy115;
			goto yy91;
		}
yy107:
		++YYCURSOR;
		{
		s->str_esc += 5;
		PHP_JSON_CONDITION_GOTO(STR_P1);
	}
yy109:
		++YYCURSOR;
		{
		s->str_esc += 4;
		PHP_JSON_CONDITION_GOTO(STR_P1);
	}
yy111:
		++YYCURSOR;
		{
		s->str_esc += 3;
		PHP_JSON_CONDITION_GOTO(STR_P1);
	}
yy113:
		yyaccept = 2;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych == '\\') goto yy116;
yy114:
		{
		s->errcode = PHP_JSON_ERROR_UTF16;
		return PHP_JSON_T_ERROR;
	}
yy115:
		++YYCURSOR;
		goto yy114;
yy116:
		yych = *++YYCURSOR;
		if (yych != 'u') goto yy91;
		yych = *++YYCURSOR;
		if (yych == 'D') goto yy118;
		if (yych != 'd') goto yy91;
yy118:
		yych = *++YYCURSOR;
		if (yych <= 'B') goto yy91;
		if (yych <= 'F') goto yy119;
		if (yych <= 'b') goto yy91;
		if (yych >= 'g') goto yy91;
yy119:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych >= ':') goto yy91;
		} else {
			if (yych <= 'F') goto yy120;
			if (yych <= '`') goto yy91;
			if (yych >= 'g') goto yy91;
		}
yy120:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy91;
			if (yych >= ':') goto yy91;
		} else {
			if (yych <= 'F') goto yy121;
			if (yych <= '`') goto yy91;
			if (yych >= 'g') goto yy91;
		}
yy121:
		++YYCURSOR;
		{
		s->str_esc += 8;
		PHP_JSON_CONDITION_GOTO(STR_P1);
	}
/* *********************************** */
yyc_STR_P2_BIN:
		yych = *YYCURSOR;
		if (yych <= 0xDF) {
			if (yych <= '[') {
				if (yych == '"') goto yy127;
			} else {
				if (yych <= '\\') goto yy129;
				if (yych <= 0x7F) goto yy125;
				if (yych <= 0xC1) goto yy131;
				goto yy133;
			}
		} else {
			if (yych <= 0xEF) {
				if (yych <= 0xE0) goto yy134;
				if (yych == 0xED) goto yy136;
				goto yy135;
			} else {
				if (yych <= 0xF0) goto yy137;
				if (yych <= 0xF3) goto yy138;
				if (yych <= 0xF4) goto yy139;
				goto yy131;
			}
		}
yy125:
		++YYCURSOR;
		{ PHP_JSON_CONDITION_GOTO(STR_P2_BIN); }
yy127:
		++YYCURSOR;
		YYSETCONDITION(yycJS);
		{
		PHP_JSON_SCANNER_COPY_ESC();
		return PHP_JSON_T_STRING;
	}
yy129:
		yyaccept = 0;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych == 'u') goto yy140;
yy130:
		{
		char esc;
		PHP_JSON_SCANNER_COPY_ESC();
		switch (*s->cursor) {
			case 'b':
				esc = '\b';
				break;
			case 'f':
				esc = '\f';				break;
			case 'n':
				esc = '\n';
				break;
			case 'r':
				esc = '\r';
				break;
			case 't':
				esc = '\t';
				break;
			case '\\':
			case '/':
			case '"':
				esc = *s->cursor;
				break;
			default:
				s->errcode = PHP_JSON_ERROR_SYNTAX;
				return PHP_JSON_T_ERROR;
		}
		*(s->pstr++) = esc;
		++YYCURSOR;
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy131:
		++YYCURSOR;
yy132:
		{
		if (s->utf8_invalid) {
			PHP_JSON_SCANNER_COPY_ESC();
			if (s->options & PHP_JSON_INVALID_UTF8_SUBSTITUTE) {
				*(s->pstr++) = (char) (0xe0 | (0xfffd >> 12));
				*(s->pstr++) = (char) (0x80 | ((0xfffd >> 6) & 0x3f));
				*(s->pstr++) = (char) (0x80 | (0xfffd & 0x3f));
			}
			s->str_start = s->cursor;
		}
		PHP_JSON_CONDITION_GOTO(STR_P2_BIN);
	}
yy133:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy132;
		if (yych <= 0xBF) goto yy125;
		goto yy132;
yy134:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x9F) goto yy132;
		if (yych <= 0xBF) goto yy142;
		goto yy132;
yy135:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy132;
		if (yych <= 0xBF) goto yy142;
		goto yy132;
yy136:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy132;
		if (yych <= 0x9F) goto yy142;
		goto yy132;
yy137:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x8F) goto yy132;
		if (yych <= 0xBF) goto yy143;
		goto yy132;
yy138:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy132;
		if (yych <= 0xBF) goto yy143;
		goto yy132;
yy139:
		yyaccept = 1;
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych <= 0x7F) goto yy132;
		if (yych <= 0x8F) goto yy143;
		goto yy132;
yy140:
		yych = *++YYCURSOR;
		if (yych <= 'D') {
			if (yych <= '9') {
				if (yych <= '/') goto yy141;
				if (yych <= '0') goto yy144;
				goto yy145;
			} else {
				if (yych <= '@') goto yy141;
				if (yych <= 'C') goto yy145;
				goto yy146;
			}
		} else {
			if (yych <= 'c') {
				if (yych <= 'F') goto yy145;
				if (yych >= 'a') goto yy145;
			} else {
				if (yych <= 'd') goto yy146;
				if (yych <= 'f') goto yy145;
			}
		}
yy141:
		YYCURSOR = YYMARKER;
		if (yyaccept == 0) {
			goto yy130;
		} else {
			goto yy132;
		}
yy142:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy141;
		if (yych <= 0xBF) goto yy125;
		goto yy141;
yy143:
		yych = *++YYCURSOR;
		if (yych <= 0x7F) goto yy141;
		if (yych <= 0xBF) goto yy142;
		goto yy141;
yy144:
		yych = *++YYCURSOR;
		if (yych <= '9') {
			if (yych <= '/') goto yy141;
			if (yych <= '0') goto yy147;
			if (yych <= '7') goto yy148;
			goto yy149;
		} else {
			if (yych <= 'F') {
				if (yych <= '@') goto yy141;
				goto yy149;
			} else {
				if (yych <= '`') goto yy141;
				if (yych <= 'f') goto yy149;
				goto yy141;
			}
		}
yy145:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy149;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy149;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy149;
			goto yy141;
		}
yy146:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '7') goto yy149;
			if (yych <= '9') goto yy150;
			goto yy141;
		} else {
			if (yych <= 'B') goto yy150;
			if (yych <= '`') goto yy141;
			if (yych <= 'b') goto yy150;
			goto yy141;
		}
yy147:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '7') goto yy151;
			if (yych <= '9') goto yy152;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy152;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy152;
			goto yy141;
		}
yy148:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy152;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy152;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy152;
			goto yy141;
		}
yy149:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy153;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy153;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy153;
			goto yy141;
		}
yy150:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy154;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy154;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy154;
			goto yy141;
		}
yy151:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy155;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy155;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy155;
			goto yy141;
		}
yy152:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy157;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy157;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy157;
			goto yy141;
		}
yy153:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy159;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy159;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy159;
			goto yy141;
		}
yy154:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych <= '9') goto yy161;
			goto yy141;
		} else {
			if (yych <= 'F') goto yy161;
			if (yych <= '`') goto yy141;
			if (yych <= 'f') goto yy161;
			goto yy141;
		}
yy155:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 2);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) utf16;
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy157:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 3);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) (0xc0 | (utf16 >> 6));
		*(s->pstr++) = (char) (0x80 | (utf16 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy159:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 4);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) (0xe0 | (utf16 >> 12));
		*(s->pstr++) = (char) (0x80 | ((utf16 >> 6) & 0x3f));
		*(s->pstr++) = (char) (0x80 | (utf16 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy161:
		yych = *++YYCURSOR;
		if (yych != '\\') goto yy141;
		yych = *++YYCURSOR;
		if (yych != 'u') goto yy141;
		yych = *++YYCURSOR;
		if (yych == 'D') goto yy164;
		if (yych != 'd') goto yy141;
yy164:
		yych = *++YYCURSOR;
		if (yych <= 'B') goto yy141;
		if (yych <= 'F') goto yy165;
		if (yych <= 'b') goto yy141;
		if (yych >= 'g') goto yy141;
yy165:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych >= ':') goto yy141;
		} else {
			if (yych <= 'F') goto yy166;
			if (yych <= '`') goto yy141;
			if (yych >= 'g') goto yy141;
		}
yy166:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy141;
			if (yych >= ':') goto yy141;
		} else {
			if (yych <= 'F') goto yy167;
			if (yych <= '`') goto yy141;
			if (yych >= 'g') goto yy141;
		}
yy167:
		++YYCURSOR;
		{
		int utf32, utf16_hi, utf16_lo;
		utf16_hi = php_json_ucs2_to_int(s, 4);
		utf16_lo = php_json_ucs2_to_int_ex(s, 4, 7);
		utf32 = ((utf16_lo & 0x3FF) << 10) + (utf16_hi & 0x3FF) + 0x10000;
		PHP_JSON_SCANNER_COPY_UTF_SP();
		*(s->pstr++) = (char) (0xf0 | (utf32 >> 18));
		*(s->pstr++) = (char) (0x80 | ((utf32 >> 12) & 0x3f));
		*(s->pstr++) = (char) (0x80 | ((utf32 >> 6) & 0x3f));
		*(s->pstr++) = (char) (0x80 | (utf32 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
/* *********************************** */
yyc_STR_P2_UTF:
		yych = *YYCURSOR;
		if (yych == '"') goto yy173;
		if (yych == '\\') goto yy175;
		++YYCURSOR;
		{ PHP_JSON_CONDITION_GOTO(STR_P2_UTF); }
yy173:
		++YYCURSOR;
		YYSETCONDITION(yycJS);
		{
		PHP_JSON_SCANNER_COPY_ESC();
		return PHP_JSON_T_STRING;
	}
yy175:
		yych = *(YYMARKER = ++YYCURSOR);
		if (yych == 'u') goto yy177;
yy176:
		{
		char esc;
		PHP_JSON_SCANNER_COPY_ESC();
		switch (*s->cursor) {
			case 'b':
				esc = '\b';
				break;
			case 'f':
				esc = '\f';				break;
			case 'n':
				esc = '\n';
				break;
			case 'r':
				esc = '\r';
				break;
			case 't':
				esc = '\t';
				break;
			case '\\':
			case '/':
			case '"':
				esc = *s->cursor;
				break;
			default:
				s->errcode = PHP_JSON_ERROR_SYNTAX;
				return PHP_JSON_T_ERROR;
		}
		*(s->pstr++) = esc;
		++YYCURSOR;
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy177:
		yych = *++YYCURSOR;
		if (yych <= 'D') {
			if (yych <= '9') {
				if (yych <= '/') goto yy178;
				if (yych <= '0') goto yy179;
				goto yy180;
			} else {
				if (yych <= '@') goto yy178;
				if (yych <= 'C') goto yy180;
				goto yy181;
			}
		} else {
			if (yych <= 'c') {
				if (yych <= 'F') goto yy180;
				if (yych >= 'a') goto yy180;
			} else {
				if (yych <= 'd') goto yy181;
				if (yych <= 'f') goto yy180;
			}
		}
yy178:
		YYCURSOR = YYMARKER;
		goto yy176;
yy179:
		yych = *++YYCURSOR;
		if (yych <= '9') {
			if (yych <= '/') goto yy178;
			if (yych <= '0') goto yy182;
			if (yych <= '7') goto yy183;
			goto yy184;
		} else {
			if (yych <= 'F') {
				if (yych <= '@') goto yy178;
				goto yy184;
			} else {
				if (yych <= '`') goto yy178;
				if (yych <= 'f') goto yy184;
				goto yy178;
			}
		}
yy180:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy184;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy184;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy184;
			goto yy178;
		}
yy181:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '7') goto yy184;
			if (yych <= '9') goto yy185;
			goto yy178;
		} else {
			if (yych <= 'B') goto yy185;
			if (yych <= '`') goto yy178;
			if (yych <= 'b') goto yy185;
			goto yy178;
		}
yy182:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '7') goto yy186;
			if (yych <= '9') goto yy187;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy187;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy187;
			goto yy178;
		}
yy183:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy187;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy187;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy187;
			goto yy178;
		}
yy184:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy188;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy188;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy188;
			goto yy178;
		}
yy185:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy189;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy189;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy189;
			goto yy178;
		}
yy186:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy190;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy190;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy190;
			goto yy178;
		}
yy187:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy192;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy192;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy192;
			goto yy178;
		}
yy188:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy194;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy194;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy194;
			goto yy178;
		}
yy189:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych <= '9') goto yy196;
			goto yy178;
		} else {
			if (yych <= 'F') goto yy196;
			if (yych <= '`') goto yy178;
			if (yych <= 'f') goto yy196;
			goto yy178;
		}
yy190:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 2);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) utf16;
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy192:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 3);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) (0xc0 | (utf16 >> 6));
		*(s->pstr++) = (char) (0x80 | (utf16 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy194:
		++YYCURSOR;
		{
		int utf16 = php_json_ucs2_to_int(s, 4);
		PHP_JSON_SCANNER_COPY_UTF();
		*(s->pstr++) = (char) (0xe0 | (utf16 >> 12));
		*(s->pstr++) = (char) (0x80 | ((utf16 >> 6) & 0x3f));
		*(s->pstr++) = (char) (0x80 | (utf16 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
yy196:
		yych = *++YYCURSOR;
		if (yych != '\\') goto yy178;
		yych = *++YYCURSOR;
		if (yych != 'u') goto yy178;
		yych = *++YYCURSOR;
		if (yych == 'D') goto yy199;
		if (yych != 'd') goto yy178;
yy199:
		yych = *++YYCURSOR;
		if (yych <= 'B') goto yy178;
		if (yych <= 'F') goto yy200;
		if (yych <= 'b') goto yy178;
		if (yych >= 'g') goto yy178;
yy200:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych >= ':') goto yy178;
		} else {
			if (yych <= 'F') goto yy201;
			if (yych <= '`') goto yy178;
			if (yych >= 'g') goto yy178;
		}
yy201:
		yych = *++YYCURSOR;
		if (yych <= '@') {
			if (yych <= '/') goto yy178;
			if (yych >= ':') goto yy178;
		} else {
			if (yych <= 'F') goto yy202;
			if (yych <= '`') goto yy178;
			if (yych >= 'g') goto yy178;
		}
yy202:
		++YYCURSOR;
		{
		int utf32, utf16_hi, utf16_lo;
		utf16_hi = php_json_ucs2_to_int(s, 4);
		utf16_lo = php_json_ucs2_to_int_ex(s, 4, 7);
		utf32 = ((utf16_lo & 0x3FF) << 10) + (utf16_hi & 0x3FF) + 0x10000;
		PHP_JSON_SCANNER_COPY_UTF_SP();
		*(s->pstr++) = (char) (0xf0 | (utf32 >> 18));
		*(s->pstr++) = (char) (0x80 | ((utf32 >> 12) & 0x3f));
		*(s->pstr++) = (char) (0x80 | ((utf32 >> 6) & 0x3f));
		*(s->pstr++) = (char) (0x80 | (utf32 & 0x3f));
		s->str_start = s->cursor;
		PHP_JSON_CONDITION_GOTO_STR_P2();
	}
	}


}
