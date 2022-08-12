/* A Bison parser, made by GNU Bison 3.3.2.  */

/* Bison interface for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2019 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* Undocumented macros, especially those whose name start with YY_,
   are private implementation details.  Do not rely on them.  */

#ifndef YY_PHPDBG_SAPI_PHPDBG_PHPDBG_PARSER_H_INCLUDED
# define YY_PHPDBG_SAPI_PHPDBG_PHPDBG_PARSER_H_INCLUDED
/* Debug traces.  */
#ifndef PHPDBG_DEBUG
# if defined YYDEBUG
#if YYDEBUG
#   define PHPDBG_DEBUG 1
#  else
#   define PHPDBG_DEBUG 0
#  endif
# else /* ! defined YYDEBUG */
#  define PHPDBG_DEBUG 0
# endif /* ! defined YYDEBUG */
#endif  /* ! defined PHPDBG_DEBUG */
#if PHPDBG_DEBUG
extern int phpdbg_debug;
#endif
/* "%code requires" blocks.  */
#line 7 "sapi/phpdbg/phpdbg_parser.y" /* yacc.c:1921  */

#include "phpdbg.h"
#ifndef YY_TYPEDEF_YY_SCANNER_T
#define YY_TYPEDEF_YY_SCANNER_T
typedef void* yyscan_t;
#endif

#line 64 "sapi/phpdbg/phpdbg_parser.h" /* yacc.c:1921  */

/* Token type.  */
#ifndef PHPDBG_TOKENTYPE
# define PHPDBG_TOKENTYPE
  enum phpdbg_tokentype
  {
    END = 0,
    T_EVAL = 258,
    T_RUN = 259,
    T_SHELL = 260,
    T_IF = 261,
    T_TRUTHY = 262,
    T_FALSY = 263,
    T_STRING = 264,
    T_COLON = 265,
    T_DCOLON = 266,
    T_POUND = 267,
    T_SEPARATOR = 268,
    T_PROTO = 269,
    T_DIGITS = 270,
    T_LITERAL = 271,
    T_ADDR = 272,
    T_OPCODE = 273,
    T_ID = 274,
    T_INPUT = 275,
    T_UNEXPECTED = 276,
    T_REQ_ID = 277
  };
#endif

/* Value type.  */
#if ! defined PHPDBG_STYPE && ! defined PHPDBG_STYPE_IS_DECLARED
typedef phpdbg_param_t PHPDBG_STYPE;
# define PHPDBG_STYPE_IS_TRIVIAL 1
# define PHPDBG_STYPE_IS_DECLARED 1
#endif



int phpdbg_parse (void);

#endif /* !YY_PHPDBG_SAPI_PHPDBG_PHPDBG_PARSER_H_INCLUDED  */
