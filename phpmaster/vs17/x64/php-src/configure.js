/* This file automatically generated from win32/build/confutils.js */
MODE_PHPIZE=false;
// Utils for configure script
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
  | Author: Wez Furlong <wez@thebrainroom.com>                           |
  +----------------------------------------------------------------------+
*/

var STDOUT = WScript.StdOut;
var STDERR = WScript.StdErr;
var WshShell = WScript.CreateObject("WScript.Shell");
var FSO = WScript.CreateObject("Scripting.FileSystemObject");
var MFO = null;
var SYSTEM_DRIVE = WshShell.Environment("Process").Item("SystemDrive");
var PROGRAM_FILES = WshShell.Environment("Process").Item("ProgramFiles");
var PROGRAM_FILESx86 = WshShell.Environment("Process").Item("ProgramFiles(x86)");
var VCINSTALLDIR = WshShell.Environment("Process").Item("VCINSTALLDIR");
var PHP_SRC_DIR=FSO.GetParentFolderName(WScript.ScriptFullName);

var VS_TOOLSET = true;
var CLANG_TOOLSET = false;
var ICC_TOOLSET = false;
var VCVERS = -1;
var CLANGVERS = -1;
var INTELVERS = -1;
var COMPILER_NUMERIC_VERSION = -1;
var COMPILER_NAME_LONG = "unknown";
var COMPILER_NAME_SHORT = "unknown";
var PHP_OBJECT_OUT_DIR = "";
var PHP_CONFIG_PROFILE = "no";
var PHP_SANITIZER = "no";
var VERBOSITY = 0;
var CMD_MOD1 = "@";
var CMD_MOD2 = "@";

var PHP_TEST_INI_PATH = "";
var PHP_TEST_INI = "";
var PHP_TEST_INI_EXT_EXCLUDE = "";

var PHP_MAKEFILE_FRAGMENTS = PHP_SRC_DIR + "\\Makefile.fragments.w32";

/* Care also about NTDDI_VERSION and _WIN32_WINNT in config.w32.h.in
   and manifest. */
var WINVER = "0x0601"; /* 7/2008r2 */

// There's a minimum requirement for bison.
var MINBISON = "3.0.0";

// There's a minimum requirement for re2c..
var MINRE2C = "0.13.4";

/* Store the enabled extensions (summary + QA check) */
var extensions_enabled = new Array();

/* Store the SAPI enabled (summary + QA check) */
var sapi_enabled = new Array();

/* Store the headers to install */
var headers_install = new Array();

/* Store unknown configure options */
var INVALID_CONFIG_ARGS = new Array();

if (PROGRAM_FILES == null) {
	PROGRAM_FILES = "C:\\Program Files";
}

if (MODE_PHPIZE) {
	if (!FSO.FileExists("config.w32")) {
		STDERR.WriteLine("Must be run from the root of the extension source");
		WScript.Quit(10);
	}
} else {
	if (!FSO.FileExists("main\\php_version.h")) {
		STDERR.WriteLine("Must be run from the root of the php source");
		WScript.Quit(10);
	}
}

var CWD = WshShell.CurrentDirectory;

if (typeof(CWD) == "undefined") {
	CWD = FSO.GetParentFolderName(FSO.GetParentFolderName(FSO.GetAbsolutePathName("main\\php_version.h")));
}

if (!MODE_PHPIZE) {
	/* defaults; we pick up the precise versions from configure.ac */
	var PHP_VERSION = 8;
	var PHP_MINOR_VERSION = 1;
	var PHP_RELEASE_VERSION = 0;
	var PHP_EXTRA_VERSION = "";
	var PHP_VERSION_STRING = "8.1.0";
}

/* Get version numbers and DEFINE as a string */
function get_version_numbers()
{
	var cin = file_get_contents("configure.ac");
	var regex = /AC_INIT.+(\d+)\.(\d+)\.(\d+)([^\,^\]]*).+/g;

	if (cin.match(new RegExp(regex))) {
		PHP_VERSION = RegExp.$1;
		PHP_MINOR_VERSION = RegExp.$2;
		PHP_RELEASE_VERSION = RegExp.$3;
		PHP_EXTRA_VERSION = RegExp.$4;
	}

	PHP_VERSION_STRING = PHP_VERSION + "." + PHP_MINOR_VERSION + "." + PHP_RELEASE_VERSION + PHP_EXTRA_VERSION;

	DEFINE('PHP_VERSION_STRING', PHP_VERSION_STRING);
}

configure_args = new Array();
configure_subst = WScript.CreateObject("Scripting.Dictionary");

configure_hdr = WScript.CreateObject("Scripting.Dictionary");
build_dirs = new Array();

extension_include_code = "";
extension_module_ptrs = "";

(function () {
	var wmiservice = GetObject("winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2");
	var oss = wmiservice.ExecQuery("Select * from Win32_OperatingSystem");
	var os = oss.ItemIndex(0);
	AC_DEFINE("PHP_BUILD_SYSTEM", os.Caption + " [" + os.Version + "]", "Windows build system version");
	var build_provider = WshShell.Environment("Process").Item("PHP_BUILD_PROVIDER");
	if (build_provider) {
		AC_DEFINE("PHP_BUILD_PROVIDER", build_provider);
	}
}());

if (!MODE_PHPIZE) {
	get_version_numbers();
}

/* execute a command and return the output as a string */
function execute(command_line)
{
	var e = WshShell.Exec(command_line);
	var ret = "";

	ret = e.StdOut.ReadAll();

//STDOUT.WriteLine("command " + command_line);
//STDOUT.WriteLine(ret);

	return ret;
}

function probe_binary(EXE, what)
{
	// tricky escapes to get stderr redirection to work
	var command = 'cmd /c ""' + EXE;
	if (what == "version") {
		command = command + '" -v"';
	} else if (what == "longversion") {
		command = command + '" --version"';
	}
	var version = execute(command + '" 2>&1"');

	if (what == "64") {
		if (version.match(/x64/)) {
			return 1;
		}
	} else {
		if (version.match(/(\d+\.\d+(\.\d+)?(\.\d+)?)/)) {
			return RegExp.$1;
		}
	}
	return 0;
}

function condense_path(path)
{
	path = FSO.GetAbsolutePathName(path);

	if (path.substr(0, CWD.length).toLowerCase()
			== CWD.toLowerCase() &&
			(path.charCodeAt(CWD.length) == 92 || path.charCodeAt(CWD.length) == 47)) {
		return path.substr(CWD.length + 1);
	}

	var a = CWD.split("\\");
	var b = path.split("\\");
	var i, j;

	for (i = 0; i < b.length; i++) {
		if (a[i].toLowerCase() == b[i].toLowerCase())
			continue;
		if (i > 0) {
			/* first difference found */
			path = "";
			for (j = 0; j < a.length - i; j++) {
				path += "..\\";
			}
			for (j = i; j < b.length; j++) {
				path += b[j];
				if (j < b.length - 1)
					path += "\\";
			}
			return path;
		}
		/* on a different drive */
		break;
	}

	return path;
}

function ConfigureArg(type, optname, helptext, defval)
{
	var opptype = type == "enable" ? "disable" : "without";

	if (defval == "yes" || defval == "yes,shared") {
		this.arg = "--" + opptype + "-" + optname;
		this.imparg = "--" + type + "-" + optname;
	} else {
		this.arg = "--" + type + "-" + optname;
		this.imparg = "--" + opptype + "-" + optname;
	}

	this.optname = optname;
	this.helptext = helptext;
	this.defval = defval;
	this.symval = optname.toUpperCase().replace(new RegExp("-", "g"), "_");
	this.seen = false;
	this.argval = defval;
}

function ARG_WITH(optname, helptext, defval)
{
	configure_args[configure_args.length] = new ConfigureArg("with", optname, helptext, defval);
}

function ARG_ENABLE(optname, helptext, defval)
{
	configure_args[configure_args.length] = new ConfigureArg("enable", optname, helptext, defval);
}

function analyze_arg(argval)
{
	var ret = new Array();
	var shared = false;

	if (argval == "shared") {
		shared = true;
		argval = "yes";
	} else if (argval == null) {
		/* nothing */
	} else if (arg_match = argval.match(new RegExp("^shared,(.*)"))) {
		shared = true;
		argval = arg_match[1];
	} else if (arg_match = argval.match(new RegExp("^(.*),shared$"))) {
		shared = true;
		argval = arg_match[1];
	}

	ret[0] = shared;
	ret[1] = argval;
	return ret;
}

function word_wrap_and_indent(indent, text, line_suffix, indent_char)
{
	if (text == null) {
		return "";
	}

	var words = text.split(new RegExp("\\s+", "g"));
	var i = 0;
	var ret_text = "";
	var this_line = "";
	var t;
	var space = "";
	var lines = 0;

	if (line_suffix == null) {
		line_suffix = "";
	}

	if (indent_char == null) {
		indent_char = " ";
	}

	for (i = 0; i < indent; i++) {
		space += indent_char;
	}

	for (i = 0; i < words.length; i++) {
		if (this_line.length) {
			t = this_line + " " + words[i];
		} else {
			t = words[i];
		}

		if (t.length + indent > 78) {
			if (lines++) {
				ret_text += space;
			}
			ret_text += this_line + line_suffix + "\r\n";
			this_line = "";
		}

		if (this_line.length) {
			this_line += " " + words[i];
		} else {
			this_line = words[i];
		}
	}

	if (this_line.length) {
		if (lines)
			ret_text += space;
		ret_text += this_line;
	}

	return ret_text;
}

function conf_process_args()
{
	var i, j;
	var configure_help_mode = false;
	var analyzed = false;
	var nice = "cscript /nologo /e:jscript configure.js ";
	var disable_all = false;

	args = WScript.Arguments;
	for (i = 0; i < args.length; i++) {
		arg = args(i);
		nice += ' "' + arg + '"';

		if (arg == "--help") {
			configure_help_mode = true;
			break;
		}
		if (arg == "--disable-all") {
			disable_all = true;
			continue;
		}

		// If it is --foo=bar, split on the equals sign
		arg = arg.split("=", 2);
		argname = arg[0];
		if (arg.length > 1) {
			argval = arg[1];
		} else {
			argval = null;
		}

		// Find the arg
		found = false;
		for (j = 0; j < configure_args.length; j++) {
			if (argname == configure_args[j].imparg || argname == configure_args[j].arg) {
				found = true;

				arg = configure_args[j];
				arg.seen = true;

				analyzed = analyze_arg(argval);

				/* Force shared when called after phpize */
				if (MODE_PHPIZE) {
					shared = "shared";
				} else {
					shared = analyzed[0];
				}
				argval = analyzed[1];

				if (argname == arg.imparg) {
					/* we matched the implicit, or default arg */
					if (argval == null) {
						argval = arg.defval;
					}
				} else {
					/* we matched the non-default arg */
					if (argval == null) {
						if (arg.defval == "no") {
							argval = "yes";
						} else if (arg.defval == "no,shared") {
							argval = "yes,shared";
							shared = true;
						} else {
							argval = "no";
						}
					}
				}

				arg.argval = argval;
				eval("PHP_" + arg.symval + " = argval;");
				eval("PHP_" + arg.symval + "_SHARED = shared;");
				break;
			}
		}
		if (!found) {
			INVALID_CONFIG_ARGS[INVALID_CONFIG_ARGS.length] = argname;
		}
	}

	if (PHP_SNAPSHOT_BUILD != 'no' && INVALID_CONFIG_ARGS.length) {
		STDERR.WriteLine('Unknown option ' + INVALID_CONFIG_ARGS[0] + '; please try configure.js --help for a list of valid options');
		WScript.Quit(2);
	}

	if (configure_help_mode) {
		STDOUT.WriteLine(word_wrap_and_indent(0,
"Options that enable extensions and SAPI will accept \
'yes' or 'no' as a parameter.  They also accept 'shared' \
as a synonym for 'yes' and request a shared build of that \
module.  Not all modules can be built as shared modules; \
configure will display [shared] after the module name if \
can be built that way. \
"
			));
		STDOUT.WriteBlankLines(1);

		// Measure width to pretty-print the output
		max_width = 0;
		for (i = 0; i < configure_args.length; i++) {
			arg = configure_args[i];
			if (arg.arg.length > max_width)
				max_width = arg.arg.length;
		}

		for (i = 0; i < configure_args.length; i++) {
			arg = configure_args[i];

			n = max_width - arg.arg.length;
			pad = "   ";
			for (j = 0; j < n; j++) {
				pad += " ";
			}
			STDOUT.WriteLine("  " + arg.arg + pad + word_wrap_and_indent(max_width + 5, arg.helptext));
		}
		STDOUT.WriteBlankLines(1);
		STDOUT.WriteLine("Some influential environment variables:");
		STDOUT.WriteLine("  CFLAGS      C compiler flags");
		STDOUT.WriteLine("  LDFLAGS     linker flags");
		WScript.Quit(1);
	}

	var snapshot_build_exclusions = new Array(
		'debug', 'lzf-better-compression',
		 'php-build', 'snapshot-template', 'ereg',
		 'pcre-regex', 'fastcgi', 'force-cgi-redirect',
		 'path-info-check', 'zts', 'ipv6', 'memory-limit',
		 'zend-multibyte', 'fd-setsize', 'memory-manager',
		 'pgi', 'pgo', 'all-shared', 'config-profile',
		 'sanitizer'
		);
	var force;

	// Now set any defaults we might have missed out earlier
	for (i = 0; i < configure_args.length; i++) {
		arg = configure_args[i];
		if (arg.seen)
			continue;
		analyzed = analyze_arg(arg.defval);
		shared = analyzed[0];
		argval = analyzed[1];

		// Don't trust a default "yes" answer for a non-core module
		// in a snapshot build
		if (PHP_SNAPSHOT_BUILD != "no" && argval == "yes" && !shared) {

			force = true;
			for (j = 0; j < snapshot_build_exclusions.length; j++) {
				if (snapshot_build_exclusions[j] == arg.optname) {
					force = false;
					break;
				}
			}

			if (force) {
				/* now check if it is a core module */
				force = false;
				for (j = 0; j < core_module_list.length; j++) {
					if (core_module_list[j] == arg.optname) {
						force = true;
						break;
					}
				}

				if (!force) {
					STDOUT.WriteLine("snapshot: forcing " + arg.arg + " shared");
					shared = true;
				}
			}
		}

		if (PHP_SNAPSHOT_BUILD != "no" && argval == "no") {
			force = true;
			for (j = 0; j < snapshot_build_exclusions.length; j++) {
				if (snapshot_build_exclusions[j] == arg.optname) {
					force = false;
					break;
				}
			}
			if (force) {
				STDOUT.WriteLine("snapshot: forcing " + arg.optname + " on");
				argval = "yes";
				shared = true;
			}
		}

		if (disable_all) {
			force = true;
			for (j = 0; j < snapshot_build_exclusions.length; j++) {
				if (snapshot_build_exclusions[j] == arg.optname) {
					force = false;
					break;
				}
			}
			if (force) {
				if (arg.defval == '') {
					argval = '';
				} else {
					argval = "no";
				}
				shared = false;
			}
		}

		eval("PHP_" + arg.symval + " = argval;");
		eval("PHP_" + arg.symval + "_SHARED = shared;");
	}

	MFO = FSO.CreateTextFile("Makefile.objects", true);

	var profile = false;

	if (PHP_CONFIG_PROFILE != 'no') {
		if (PHP_CONFIG_PROFILE.toLowerCase() == 'nice') {
			WARNING('Config profile name cannot be named \'nice\'');
		} else {
			var config_profile = FSO.CreateTextFile('config.' + PHP_CONFIG_PROFILE + '.bat', true);

			config_profile.WriteLine('@echo off');
			config_profile.WriteLine(nice + ' %*');
			config_profile.Close();

			profile = true;
		}
	}

	// Only generate an updated config.nice.bat file if a profile was not used
	if (!profile) {
		STDOUT.WriteLine("Saving configure options to config.nice.bat");

		var nicefile = FSO.CreateTextFile("config.nice.bat", true);
		nicefile.WriteLine('@echo off');
		nicefile.WriteLine(nice +  " %*");
		nicefile.Close();
	}

	AC_DEFINE('CONFIGURE_COMMAND', nice, "Configure line");
}

function DEFINE(name, value)
{
	if (configure_subst.Exists(name)) {
		configure_subst.Remove(name);
	}
	configure_subst.Add(name, value);
}

function verbalize_deps_path(path)
{
	var absolute_path = FSO.GetAbsolutePathName(path);

	if (absolute_path.indexOf(PHP_PHP_BUILD) == 0) {
		absolute_path = absolute_path.substring(PHP_PHP_BUILD.length).split('\\');

		if (absolute_path[1] == 'include' || absolute_path[1] == 'lib') {
			return "<in deps path> " + absolute_path.join('\\');
		}
	}

	return path;
}

// Searches a set of paths for a file;
// returns the dir in which the file was found,
// true if it was found in the default env path,
// or false if it was not found at all.
// env_name is the optional name of an env var
// specifying the default path to search
function search_paths(thing_to_find, explicit_path, env_name)
{
	var i, found = false, place = false, file, env;

	STDOUT.Write("Checking for " + thing_to_find + " ... ");

	thing_to_find = thing_to_find.replace(new RegExp("/", "g"), "\\");

	if (explicit_path != null) {
		if (typeof(explicit_path) == "string") {
			explicit_path = explicit_path.split(";");
		}

		for (i = 0; i < explicit_path.length; i++) {
			file = glob(explicit_path[i] + "\\" + thing_to_find);
			if (file) {
				found = true;
				place = file[0];
				place = place.substr(0, place.length - thing_to_find.length - 1);
				break;
			}
		}
	}

	if (!found && env_name != null) {
		env = WshShell.Environment("Process").Item(env_name);
		env = env.split(";");
		for (i = 0; i < env.length; i++) {
			file = glob(env[i] + "\\" + thing_to_find);
			if (file) {
				found = true;
				place = true;
				break;
			}
		}
	}

	if (found && place == true) {
		STDOUT.WriteLine(" <in default path>");
	} else if (found) {
		STDOUT.WriteLine(" " + verbalize_deps_path(place));
	} else {
		STDOUT.WriteLine(" <not found>");
	}
	return place;
}

function PATH_PROG(progname, additional_paths, symbol)
{
	var exe;
	var place;
	var cyg_path = PHP_CYGWIN + "\\bin;" + PHP_CYGWIN + "\\usr\\local\\bin";
	var php_build_bin_path = PHP_PHP_BUILD + "\\bin"

	exe = progname + ".exe";

	if (additional_paths == null) {
		additional_paths = cyg_path;
	} else {
		additional_paths += ";" + cyg_path;
	}

	additional_paths = additional_paths + ";" + php_build_bin_path;

	place = search_paths(exe, additional_paths, "PATH");

	if (place == true) {
		place = exe;
	} else if (place != false) {
		place = place + "\\" + exe;
	}

	if (place) {
		if (symbol == null) {
			symbol = progname.toUpperCase();
		}
		DEFINE(symbol, place);
	}
	return place;
}

function find_pattern_in_path(pattern, path)
{
	if (path == null) {
		return false;
	}

	var dirs = path.split(';');
	var i;
	var items;

	for (i = 0; i < dirs.length; i++) {
		items = glob(dirs[i] + "\\" + pattern);
		if (items) {
			return condense_path(items[0]);
		}
	}
	return false;
}

function copy_dep_pdb_into_build_dir(libpath)
{
	var candidate;
	var build_dir = get_define("BUILD_DIR");
	var libdir = FSO.GetParentFolderName(libpath);
	var bindir = FSO.GetAbsolutePathName(libdir + "\\..\\bin");

	var names = [];

	var libname = FSO.GetFileName(libpath);

	/* Within same .lib, everything should be bound to the same .pdb. No check
		for every single object in the static libs. */
	var _tmp = execute("dumpbin /section:.debug$T /rawdata:1,256 " + libpath);
	if (!_tmp.match("LNK4039")) {
		if (_tmp.match(/\d{2,}:\s+([a-z0-9\s]+)/i)) {
			var m = RegExp.$1;
			var a = m.split(/ /);
			var s = "";
			for (var i in a) {
				s = s + String.fromCharCode(parseInt("0x" + a[i]));
			}

			if (s.match(/([^\\]+\.pdb)/i)) {
				if (RegExp.$1 != names[0]) {
					names.push(RegExp.$1);
				}
			}
		}
	}

	/* This is rather a fallback, if the bin has no debug section or
		something went wrong with parsing. */
	names.push(libname.replace(new RegExp("\\.lib$"), ".pdb"));

	for (var k = 0; k < names.length; k++) {
		var pdbname = names[k];

		candidate = bindir + "\\" + pdbname;
		if (FSO.FileExists(candidate)) {
			FSO.CopyFile(candidate, build_dir + "\\" + pdbname, true);
			return true;
		}

		candidate = libdir + "\\" + pdbname;
		if (FSO.FileExists(candidate)) {
			FSO.CopyFile(candidate, build_dir + "\\" + pdbname, true);
			return true;
		}
	}

	return false;
}

function CHECK_LIB(libnames, target, path_to_check, common_name)
{
	STDOUT.Write("Checking for library " + libnames + " ... ");

	if (common_name == null && target != null) {
		common_name = target;
	}

	if (path_to_check == null) {
		path_to_check = "";
	}

	// if they specified a common name for the package that contains
	// the library, tag some useful defaults on to the end of the
	// path to be searched
	if (common_name != null) {
		path_to_check += ";" + PHP_PHP_BUILD + "\\" + common_name + "*";
		path_to_check += ";" + PHP_PHP_BUILD + "\\lib\\" + common_name + "*";
		path_to_check += ";..\\" + common_name + "*";
	}

	// Determine target for build flags
	if (target == null) {
		target = "";
	} else {
		target = "_" + target.toUpperCase();
	}

	// Expand path to include general dirs
	path_to_check += ";" + php_usual_lib_suspects;

	// It is common practice to put libs under one of these dir names
	var subdirs = new Array(PHP_DEBUG == "yes" ? "Debug" : (PHP_DEBUG_PACK == "yes"?"Release_Dbg":"Release"), "lib", "libs", "libexec");

	// libnames can be ; separated list of accepted library names
	libnames = libnames.split(';');

	// for debug builds, lib may have _debug appended, we want that first
	if (PHP_DEBUG == "yes") {
		var length = libnames.length;
		for (var i = 0; i < length; i++) {
			var name = new String(libnames[i]);
			rExp = /.lib$/i;
			name = name.replace(rExp,"_debug.lib");
			libnames.unshift(name);
		}
	}

	var i, j, k, libname;
	var location = false;
	var path = path_to_check.split(';');

	for (i = 0; i < libnames.length; i++) {
		libname = libnames[i];

		for (k = 0; k < path.length; k++) {
			location = glob(path[k] + "\\" + libname);
			if (location) {
				location = location[0];
				break;
			}
			for (j = 0; j < subdirs.length; j++) {
				location = glob(path[k] + "\\" + subdirs[j] + "\\" + libname);
				if (location) {
					location = location[0];
					break;
				}
			}
			if (location)
				break;
		}

		if (location) {
			location = condense_path(location);
			var libdir = FSO.GetParentFolderName(location);
			libname = FSO.GetFileName(location);
			ADD_FLAG("LDFLAGS" + target, '/libpath:"' + libdir + '" ');
			ADD_FLAG("ARFLAGS" + target, '/libpath:"' + libdir + '" ');
			ADD_FLAG("LIBS" + target, libname);

			STDOUT.WriteLine(verbalize_deps_path(location));

			copy_dep_pdb_into_build_dir(location);

			return location;
		}

		// Check in their standard lib path
		location = find_pattern_in_path(libname, WshShell.Environment("Process").Item("LIB"));

		if (location) {
			location = condense_path(location);
			libname = FSO.GetFileName(location);
			ADD_FLAG("LIBS" + target, libname);

			STDOUT.WriteLine("<in LIB path> " + libname);

			return location;
		}

		// Check in their general extra libs path
		location = find_pattern_in_path(libname, PHP_EXTRA_LIBS);
		if (location) {
			location = condense_path(location);
			libname = FSO.GetFileName(location);
			ADD_FLAG("LIBS" + target, libname);
			STDOUT.WriteLine("<in extra libs path>");
			copy_dep_pdb_into_build_dir(location);
			return location;
		}
	}

	STDOUT.WriteLine("<not found>");

	return false;
}

function OLD_CHECK_LIB(libnames, target, path_to_check)
{
	if (target == null) {
		target = "";
	} else {
		target = "_" + target.toUpperCase();
	}

	if (path_to_check == null) {
		path_to_check = php_usual_lib_suspects;
	} else {
		path_to_check += ";" + php_usual_lib_suspects;
	}
	var have = 0;
	var p;
	var i;
	var libname;

	var subdir = PHP_DEBUG == "yes" ? "Debug" : (PHP_DEBUG_PACK == "yes"?"Release_Dbg":"Release");

	libnames = libnames.split(';');
	for (i = 0; i < libnames.length; i++) {
		libname = libnames[i];
		p = search_paths(libname, path_to_check, "LIB");

		if (!p) {
			p = search_paths(subdir + "\\" + libname, path_to_check, "LIB");
			if (p) {
				p += "\\" + subdir;
			}
		}

		if (typeof(p) == "string") {
			ADD_FLAG("LDFLAGS" + target, '/libpath:"' + p + '" ');
			ADD_FLAG("ARFLAGS" + target, '/libpath:"' + p + '" ');
			ADD_FLAG("LIBS" + target, libname);
			have = 1;
		} else if (p == true) {
			ADD_FLAG("LIBS" + target, libname);
			have = 1;
		} else {
			/* not found in the defaults or the explicit paths,
			 * so check the general extra libs; if we find
			 * it here, no need to add another /libpath: for it as we
			 * already have it covered, but we need to add the lib
			 * to LIBS_XXX */
			if (false != search_paths(libname, PHP_EXTRA_LIBS, null)) {
				ADD_FLAG("LIBS" + target, libname);
				have = 1;
			}
		}

		if (have) {
			break;
		}
	}

//	AC_DEFINE("HAVE_" + header_name.toUpperCase().replace(new RegExp("/\\\\-\.", "g"), "_"), have);

	return have;

}

function CHECK_FUNC_IN_HEADER(header_name, func_name, path_to_check, add_to_flag)
{
	var c = false;
	var sym;

	STDOUT.Write("Checking for " + func_name + " in " + header_name + " ... ");

	c = GREP_HEADER(header_name, func_name, path_to_check);

	sym = func_name.toUpperCase();
	sym = sym.replace(new RegExp("[\\\\/\.-]", "g"), "_");

	if (typeof(add_to_flag) == "undefined") {
		AC_DEFINE("HAVE_" + sym, c ? 1 : 0);
	} else {
		ADD_FLAG(add_to_flag, "/DHAVE_" + sym + "=" + (c ? "1" : "0"));
	}

	if (c) {
		STDOUT.WriteLine("OK");
		return c;
	}
	STDOUT.WriteLine("No");
	return false;
}

function GREP_HEADER(header_name, regex, path_to_check)
{
	var c = false;

	if (FSO.FileExists(path_to_check + "\\" + header_name)) {
		c = file_get_contents(path_to_check + "\\" + header_name);
	}

	if (!c) {
		/* look in the include path */

		var p = search_paths(header_name, path_to_check, "INCLUDE");
		if (typeof(p) == "string") {
			c = file_get_contents(p);
		} else if (p == false) {
			p = search_paths(header_name, PHP_EXTRA_INCLUDES, null);
			if (typeof(p) == "string") {
				c = file_get_contents(p);
			}
		}
		if (!c) {
			return false;
		}
	}

	if (typeof(regex) == "string") {
		regex = new RegExp(regex);
	}

	if (c.match(regex)) {
		/* caller can now use RegExp.$1 etc. to get at patterns */
		return true;
	}
	return false;
}

function CHECK_HEADER_ADD_INCLUDE(header_name, flag_name, path_to_check, use_env, add_dir_part, add_to_flag_only)
{
	var dir_part_to_add = "";

	if (use_env == null) {
		use_env = true;
	}

	// if true, add the dir part of the header_name to the include path
	if (add_dir_part == null) {
		add_dir_part = false;
	} else if (add_dir_part) {
		var basename = FSO.GetFileName(header_name);
		dir_part_to_add = "\\" + header_name.substr(0, header_name.length - basename.length - 1);
	}

	if (path_to_check == null) {
		path_to_check = php_usual_include_suspects;
	} else {
		path_to_check += ";" + php_usual_include_suspects;
	}

	var p = search_paths(header_name, path_to_check, use_env ? "INCLUDE" : null);
	var have = 0;
	var sym;

	if (typeof(p) == "string") {
		ADD_FLAG(flag_name, '/I "' + p + dir_part_to_add + '" ');
	} else if (p == false) {
		/* Not found in the defaults or the explicit paths,
		 * so check the general extra includes; if we find
		 * it here, no need to add another /I for it as we
		 * already have it covered, unless we are adding
		 * the dir part.... */
		p = search_paths(header_name, PHP_EXTRA_INCLUDES, null);
		if (typeof(p) == "string" && add_dir_part) {
			ADD_FLAG(flag_name, '/I "' + p + dir_part_to_add + '" ');
		}
	}
	have = p ? 1 : 0

	sym = header_name.toUpperCase();
	sym = sym.replace(new RegExp("[\\\\/\.-]", "g"), "_");

	if (typeof(add_to_flag_only) == "undefined" &&
			flag_name.match(new RegExp("^CFLAGS_(.*)$"))) {
		add_to_flag_only = true;
	}

	if (typeof(add_to_flag_only) != "undefined") {
		ADD_FLAG(flag_name, "/DHAVE_" + sym + "=" + have);
	} else if (!configure_hdr.Exists('HAVE_' + sym)) {
		AC_DEFINE("HAVE_" + sym, have, "have the " + header_name + " header file");
	}

	return p;
}

/* XXX check whether some manifest was originally supplied, otherwise keep using the default. */
function generate_version_info_manifest(makefiletarget)
{
	var manifest_name = makefiletarget + ".manifest";

	if (MODE_PHPIZE) {
		MFO.WriteLine("$(BUILD_DIR)\\" + manifest_name + ": " + PHP_DIR + "\\build\\default.manifest");
		MFO.WriteLine("\t" + CMD_MOD2 + "copy " + PHP_DIR + "\\build\\default.manifest $(BUILD_DIR)\\" + makefiletarget + ".manifest >nul");
	} else {
		MFO.WriteLine("$(BUILD_DIR)\\" + manifest_name + ": win32\\build\\default.manifest");
		MFO.WriteLine("\t" + CMD_MOD2 + "copy $(PHP_SRC_DIR)\\win32\\build\\default.manifest $(BUILD_DIR)\\" + makefiletarget + ".manifest >nul");
	}

	return manifest_name;
}

/* Emits rule to generate version info for a SAPI
 * or extension.  Returns the name of the .res file
 * that will be generated */
function generate_version_info_resource(makefiletarget, basename, creditspath, sapi)
{
	var resname = makefiletarget + ".res";
	var res_desc = makefiletarget;
	var res_prod_name = "PHP " + makefiletarget;
	var credits;
	var thanks = "";
	var logo = "";
	var debug = "";
	var project_url = "http://www.php.net";
	var project_header = creditspath + "/php_" + basename + ".h";
	var versioning = "";

	if (sapi) {
		var internal_name = basename.toUpperCase() + " SAPI";
	} else {
		var internal_name = basename.toUpperCase() + " extension";
	}

	if (FSO.FileExists(creditspath + '/CREDITS')) {
		credits = FSO.OpenTextFile(creditspath + '/CREDITS', 1);
		res_desc = credits.ReadLine();
		try {
			thanks = credits.ReadLine();
		} catch (e) {
			thanks = null;
		}
		if (thanks == null) {
			thanks = "";
		} else {
			thanks = "Thanks to " + thanks;
		}
		credits.Close();
	}

	if (creditspath.match(new RegExp("pecl"))) {
		/* PECL project url - this will eventually work correctly for all */
		project_url = "http://pecl.php.net/" + basename;

		/* keep independent versioning PECL-specific for now */
		if (FSO.FileExists(project_header)) {
			if (header = FSO.OpenTextFile(project_header, 1)) {
				contents = header.ReadAll();
				/* allowed: x.x.x[a|b|-alpha|-beta][RCx][-dev] */
				if (contents.match(new RegExp('PHP_' + basename.toUpperCase() + '_VERSION(\\s+)"((\\d+\.\\d+(\.\\d+)?)((a|b)(\\d)?|\-[a-z]{3,5})?(RC\\d+)?(\-dev)?)'))) {
					project_version = RegExp.$2;
					file_version = RegExp.$3.split('.');
					if (!file_version[2]) {
						file_version[2] = 0;
					}
					versioning = '\\"" /d EXT_FILE_VERSION=' + file_version[0] + ',' + file_version[1] + ',' + file_version[2] + ' /d EXT_VERSION="\\"' + project_version;
				}
				header.Close();
			}
		}
	}

	if (makefiletarget.match(new RegExp("\\.exe$"))) {
		logo = " /d WANT_LOGO ";
	}

	if (PHP_DEBUG != "no") {
		debug = " /d _DEBUG";
	}

	/**
	 * Use user supplied template.rc if it exists
	 */
	if (FSO.FileExists(creditspath + '\\template.rc')) {
		MFO.WriteLine("$(BUILD_DIR)\\" + resname + ": " + creditspath + "\\template.rc");
		MFO.WriteLine("\t" + CMD_MOD1 + "$(RC) /nologo $(BASE_INCLUDES) /fo $(BUILD_DIR)\\" + resname + logo + debug +
			' /d FILE_DESCRIPTION="\\"' + res_desc + '\\"" /d FILE_NAME="\\"' +
			makefiletarget + '\\"" /d PRODUCT_NAME="\\"' + res_prod_name +
			versioning + '\\"" /d THANKS_GUYS="\\"' + thanks + '\\"" ' +
			creditspath + '\\template.rc');
		return resname;
	}
	if (MODE_PHPIZE) {
		MFO.WriteLine("$(BUILD_DIR)\\" + resname + ": $(PHP_DIR)\\build\\template.rc");
		MFO.WriteLine("\t" + CMD_MOD1 + "$(RC) /nologo  $(BASE_INCLUDES) /I $(PHP_DIR)/include /n /fo $(BUILD_DIR)\\" + resname + logo + debug +
			' /d FILE_DESCRIPTION="\\"' + res_desc + '\\"" /d FILE_NAME="\\"'
			+ makefiletarget + '\\"" /d URL="\\"' + project_url +
			'\\"" /d INTERNAL_NAME="\\"' + internal_name + versioning +
			'\\"" /d THANKS_GUYS="\\"' + thanks + '\\"" $(PHP_DIR)\\build\\template.rc');
	} else {
		MFO.WriteLine("$(BUILD_DIR)\\" + resname + ": win32\\build\\template.rc");
		MFO.WriteLine("\t" + CMD_MOD1 + "$(RC) /nologo  $(BASE_INCLUDES) /n /fo $(BUILD_DIR)\\" + resname + logo + debug +
			' /d FILE_DESCRIPTION="\\"' + res_desc + '\\"" /d FILE_NAME="\\"'
			+ makefiletarget + '\\"" /d URL="\\"' + project_url +
			'\\"" /d INTERNAL_NAME="\\"' + internal_name + versioning +
			'\\"" /d THANKS_GUYS="\\"' + thanks + '\\"" win32\\build\\template.rc');
	}
	MFO.WriteBlankLines(1);
	return resname;
}

/* Check if PGO is enabled for given module. To disable PGO for a particular module,
define a global variable by the following name scheme before SAPI() or EXTENSION() call
var PHP_MYMODULE_PGO = false; */
function is_pgo_desired(mod)
{
	var varname = "PHP_" + mod.toUpperCase() + "_PGO";

	/* XXX enable PGO in phpize mode */
	if (MODE_PHPIZE) {
		return false;
	}

	/* don't disable if there's no mention of the varname */
	if (eval("typeof " + varname + " == 'undefined'")) {
		return true;
	}

	return eval("!!" + varname);
}

function SAPI(sapiname, file_list, makefiletarget, cflags, obj_dir)
{
	var SAPI = sapiname.toUpperCase();
	var ldflags;
	var resname;
	var ld;
	var manifest;

	if (typeof(obj_dir) == "undefined") {
		sapiname_for_printing = configure_module_dirname;
	} else {
		sapiname_for_printing = configure_module_dirname + " (via " + obj_dir + ")";
	}

	STDOUT.WriteLine("Enabling SAPI " + sapiname_for_printing);

	MFO.WriteBlankLines(1);
	MFO.WriteLine("# objects for SAPI " + sapiname);
	MFO.WriteBlankLines(1);

	if (cflags) {
		ADD_FLAG('CFLAGS_' + SAPI, cflags);
	}

	ADD_SOURCES(configure_module_dirname, file_list, sapiname, obj_dir);
	MFO.WriteBlankLines(1);
	MFO.WriteLine("# SAPI " + sapiname);
	MFO.WriteBlankLines(1);

	/* generate a .res file containing version information */
	resname = generate_version_info_resource(makefiletarget, sapiname, configure_module_dirname, true);

	manifest_name = generate_version_info_manifest(makefiletarget);

	MFO.WriteLine(makefiletarget + ": $(BUILD_DIR)\\" + makefiletarget);
	MFO.WriteLine("\t" + CMD_MOD2 + "echo SAPI " + sapiname_for_printing + " build complete");
	if (MODE_PHPIZE) {
		MFO.WriteLine("$(BUILD_DIR)\\" + makefiletarget + ": $(DEPS_" + SAPI + ") $(" + SAPI + "_GLOBAL_OBJS) $(PHPLIB) $(BUILD_DIR)\\" + resname + " $(BUILD_DIR)\\" + manifest_name);
	} else {
		MFO.WriteLine("$(BUILD_DIR)\\" + makefiletarget + ": $(DEPS_" + SAPI + ") $(" + SAPI + "_GLOBAL_OBJS) $(BUILD_DIR)\\$(PHPLIB) $(BUILD_DIR)\\" + resname  + " $(BUILD_DIR)\\" + manifest_name);
	}

	var is_lib = makefiletarget.match(new RegExp("\\.lib$"));
	if (makefiletarget.match(new RegExp("\\.dll$"))) {
		ldflags = "/dll $(LDFLAGS)";
		manifest = "-" + CMD_MOD2 + "$(_VC_MANIFEST_EMBED_DLL)";
	} else if (is_lib) {
		ldflags = "$(ARFLAGS)";
		ld = CMD_MOD1 + "$(MAKE_LIB)";
	} else {
		ldflags = "$(LDFLAGS)";
		manifest = "-" + CMD_MOD2 + "$(_VC_MANIFEST_EMBED_EXE)";
	}

	if (PHP_SANITIZER == "yes") {
		if (CLANG_TOOLSET) {
			add_asan_opts("CFLAGS_" + SAPI, "LIBS_" + SAPI, (is_lib ? "ARFLAGS_" : "LDFLAGS_") + SAPI);
		}
	}

	if(is_pgo_desired(sapiname) && (PHP_PGI == "yes" || PHP_PGO != "no")) {
		// Add compiler and link flags if PGO options are selected
		if (PHP_DEBUG != "yes" && PHP_PGI == "yes") {
			ADD_FLAG('CFLAGS_' + SAPI, "/GL /O2");
			ADD_FLAG('LDFLAGS_' + SAPI, "/LTCG /GENPROFILE");
			if (VCVERS >= 1914) {
				ADD_FLAG('LDFLAGS_' + SAPI, "/d2:-FuncCache1");
			}
		}
		else if (PHP_DEBUG != "yes" && PHP_PGO != "no") {
			ADD_FLAG('CFLAGS_' + SAPI, "/GL /O2");
			ADD_FLAG('LDFLAGS_' + SAPI, "/LTCG /USEPROFILE");
			if (VCVERS >= 1914) {
				ADD_FLAG('LDFLAGS_' + SAPI, "/d2:-FuncCache1");
			}
		}

		ldflags += " /PGD:$(PGOPGD_DIR)\\" + makefiletarget.substring(0, makefiletarget.indexOf(".")) + ".pgd";
	}

	if (MODE_PHPIZE) {
		if (ld) {
			MFO.WriteLine("\t" + ld + " /nologo /out:$(BUILD_DIR)\\" + makefiletarget + " " + ldflags + " $(" + SAPI + "_GLOBAL_OBJS_RESP) $(PHPLIB) $(ARFLAGS_" + SAPI + ") $(LIBS_" + SAPI + ") $(BUILD_DIR)\\" + resname);
		} else {
			ld = CMD_MOD1 + '"$(LINK)"';
			MFO.WriteLine("\t" + ld + " /nologo " + " $(" + SAPI + "_GLOBAL_OBJS_RESP) $(PHPLIB) $(LIBS_" + SAPI + ") $(BUILD_DIR)\\" + resname + " /out:$(BUILD_DIR)\\" + makefiletarget + " " + ldflags + " $(LDFLAGS_" + SAPI + ")");
		}
	} else {
		if (ld) {
			MFO.WriteLine("\t" + ld + " /nologo /out:$(BUILD_DIR)\\" + makefiletarget + " " + ldflags + " $(" + SAPI + "_GLOBAL_OBJS_RESP) $(BUILD_DIR)\\$(PHPLIB) $(ARFLAGS_" + SAPI + ") $(LIBS_" + SAPI + ") $(BUILD_DIR)\\" + resname);
		} else {
			ld = CMD_MOD1 + '"$(LINK)"';
			MFO.WriteLine("\t" + ld + " /nologo " + " $(" + SAPI + "_GLOBAL_OBJS_RESP) $(BUILD_DIR)\\$(PHPLIB) $(LIBS_" + SAPI + ") $(BUILD_DIR)\\" + resname + " /out:$(BUILD_DIR)\\" + makefiletarget + " " + ldflags + " $(LDFLAGS_" + SAPI + ")");
		}
	}

	if (manifest) {
		MFO.WriteLine("\t" + manifest);
	}

	DEFINE('CFLAGS_' + SAPI + '_OBJ', '$(CFLAGS_' + SAPI + ')');

	if (configure_module_dirname.match("pecl")) {
		ADD_FLAG("PECL_TARGETS", makefiletarget);
	} else {
		ADD_FLAG("SAPI_TARGETS", makefiletarget);
	}

	MFO.WriteBlankLines(1);
	sapi_enabled[sapi_enabled.length] = [sapiname];
}

function ADD_DIST_FILE(filename)
{
	if (configure_module_dirname.match("pecl")) {
		ADD_FLAG("PECL_EXTRA_DIST_FILES", filename);
	} else {
		ADD_FLAG("PHP_EXTRA_DIST_FILES", filename);
	}
}

function file_get_contents(filename)
{
	var f, c;
	try {
		f = FSO.OpenTextFile(filename, 1);
		c = f.ReadAll();
		f.Close();
		return c;
	} catch (e) {
		STDOUT.WriteLine("Problem reading " + filename);
		return false;
	}
}

// Add a dependency on another extension, so that
// the dependencies are built before extname
function ADD_EXTENSION_DEP(extname, dependson, optional)
{
	var EXT = extname.toUpperCase();
	var DEP = dependson.toUpperCase();
	var dep_present = false;
	var dep_shared = false;

	try {
		dep_present = eval("PHP_" + DEP);

		if (dep_present != "no") {
			try {
				dep_shared = eval("PHP_" + DEP + "_SHARED");
			} catch (e) {
				dep_shared = false;
			}
		}

	} catch (e) {
		dep_present = "no";
	}

	if (optional) {
		if (dep_present == "no") {
			MESSAGE("\t" + dependson + " not found: " + dependson + " support in " + extname + " disabled");
			return false;
		}
	}

	var ext_shared = eval("PHP_" + EXT + "_SHARED");

	if (dep_shared) {
		if (!ext_shared) {
			if (optional) {
				MESSAGE("\tstatic " + extname + " cannot depend on shared " + dependson + ": " + dependson + "support disabled");
				return false;
			}
			ERROR("static " + extname + " cannot depend on shared " + dependson);
		}

		ADD_FLAG("LIBS_" + EXT, "php_" + dependson + ".lib");
		if (MODE_PHPIZE) {
			ADD_FLAG("LDFLAGS_" + EXT, "/libpath:$(BUILD_DIR_DEV)\\lib");
			ADD_FLAG("DEPS_" + EXT, "$(BUILD_DIR_DEV)\\lib\\php_" + dependson + ".lib");
		} else {
			ADD_FLAG("LDFLAGS_" + EXT, "/libpath:$(BUILD_DIR)");
			ADD_FLAG("DEPS_" + EXT, "$(BUILD_DIR)\\php_" + dependson + ".lib");
		}

	} else {

		if (dep_present == "no") {
			if (ext_shared) {
				WARNING(extname + " cannot be built: missing dependency, " + dependson + " not found");

				var dllname = ' php_' + extname + '.dll';

				if (!REMOVE_TARGET(dllname, 'EXT_TARGETS')) {
					REMOVE_TARGET(dllname, 'PECL_TARGETS');
				}

				return false;

			}

			ERROR("Cannot build " + extname + "; " + dependson + " not enabled");
			return false;
		}
	} // dependency is statically built-in to PHP
	return true;
}

var static_pgo_enabled = false;

function ZEND_EXTENSION(extname, file_list, shared, cflags, dllname, obj_dir)
{
	EXTENSION(extname, file_list, shared, cflags, dllname, obj_dir);

	extensions_enabled[extensions_enabled.length - 1][2] = true;
}

function EXTENSION(extname, file_list, shared, cflags, dllname, obj_dir)
{
	var objs = null;
	var EXT = extname.toUpperCase();
	var extname_for_printing;
	var ldflags;

	if (shared == null) {
		if (force_all_shared()) {
			shared = true;
			eval("PHP_" + EXT + "_SHARED = true;");
		} else {
			eval("shared = PHP_" + EXT + "_SHARED;");
		}
	} else {
		eval("PHP_" + EXT + "_SHARED = shared;");
	}

	if (cflags == null) {
		cflags = "";
	}

	if (typeof(obj_dir) == "undefined") {
		extname_for_printing = configure_module_dirname;
	} else {
		extname_for_printing = configure_module_dirname + " (via " + obj_dir + ")";
	}

	if (shared) {
		STDOUT.WriteLine("Enabling extension " + extname_for_printing + " [shared]");
		cflags = "/D ZEND_COMPILE_DL_EXT=1 /D COMPILE_DL_" + EXT + " /D " + EXT + "_EXPORTS=1 " + cflags;
		ADD_FLAG("CFLAGS_PHP", "/D COMPILE_DL_" + EXT);
	} else {
		STDOUT.WriteLine("Enabling extension " + extname_for_printing);
	}

	MFO.WriteBlankLines(1);
	MFO.WriteLine("# objects for EXT " + extname);
	MFO.WriteBlankLines(1);

	ADD_SOURCES(configure_module_dirname, file_list, extname, obj_dir);

	MFO.WriteBlankLines(1);

	if (shared) {
		if (dllname == null) {
			dllname = "php_" + extname + ".dll";
		}
		var libname = dllname.substring(0, dllname.length-4) + ".lib";

		var resname = generate_version_info_resource(dllname, extname, configure_module_dirname, false);
		var ld = CMD_MOD1 + '"$(LINK)"';
		var manifest_name = generate_version_info_manifest(dllname);

		ldflags = "";
		if (is_pgo_desired(extname) && (PHP_PGI == "yes" || PHP_PGO != "no")) {
			// Add compiler and link flags if PGO options are selected
			if (PHP_DEBUG != "yes" && PHP_PGI == "yes") {
				ADD_FLAG('LDFLAGS_' + EXT, "/LTCG /GENPROFILE");
				if (VCVERS >= 1914) {
					ADD_FLAG('LDFLAGS_' + EXT, "/d2:-FuncCache1");
				}
			}
			else if (PHP_DEBUG != "yes" && PHP_PGO != "no") {
				ADD_FLAG('LDFLAGS_' + EXT, "/LTCG /USEPROFILE");
				if (VCVERS >= 1914) {
					ADD_FLAG('LDFLAGS_' + EXT, "/d2:-FuncCache1");
				}
			}

			ADD_FLAG('CFLAGS_' + EXT, "/GL /O2");

			ldflags = " /PGD:$(PGOPGD_DIR)\\" + dllname.substring(0, dllname.indexOf(".")) + ".pgd";
		}

		MFO.WriteLine("$(BUILD_DIR)\\" + libname + ": $(BUILD_DIR)\\" + dllname);
		MFO.WriteBlankLines(1);
		if (MODE_PHPIZE) {
			MFO.WriteLine("$(BUILD_DIR)\\" + dllname + ": $(DEPS_" + EXT + ") $(" + EXT + "_GLOBAL_OBJS) $(PHPLIB) $(BUILD_DIR)\\" + resname + " $(BUILD_DIR)\\" + manifest_name);
			MFO.WriteLine("\t" + ld + " $(" + EXT + "_GLOBAL_OBJS_RESP) $(PHPLIB) $(LIBS_" + EXT + ") $(LIBS) $(BUILD_DIR)\\" + resname + " /out:$(BUILD_DIR)\\" + dllname + " $(DLL_LDFLAGS) $(LDFLAGS) $(LDFLAGS_" + EXT + ")");
		} else {
			MFO.WriteLine("$(BUILD_DIR)\\" + dllname + ": $(DEPS_" + EXT + ") $(" + EXT + "_GLOBAL_OBJS) $(BUILD_DIR)\\$(PHPLIB) $(BUILD_DIR)\\" + resname + " $(BUILD_DIR)\\" + manifest_name);
			MFO.WriteLine("\t" + ld + " $(" + EXT + "_GLOBAL_OBJS_RESP) $(BUILD_DIR)\\$(PHPLIB) $(LIBS_" + EXT + ") $(LIBS) $(BUILD_DIR)\\" + resname + " /out:$(BUILD_DIR)\\" + dllname + ldflags + " $(DLL_LDFLAGS) $(LDFLAGS) $(LDFLAGS_" + EXT + ")");
		}
		MFO.WriteLine("\t-" + CMD_MOD2 + "$(_VC_MANIFEST_EMBED_DLL)");
		MFO.WriteBlankLines(1);

		if (configure_module_dirname.match("pecl")) {
			ADD_FLAG("PECL_TARGETS", dllname);
		} else {
			ADD_FLAG("EXT_TARGETS", dllname);
		}
		MFO.WriteLine(dllname + ": $(BUILD_DIR)\\" + dllname);
		MFO.WriteLine("\t" + CMD_MOD2 + "echo EXT " + extname + " build complete");
		MFO.WriteBlankLines(1);

		DEFINE('CFLAGS_' + EXT + '_OBJ', '$(CFLAGS_' + EXT + ')');
	} else {
		ADD_FLAG("STATIC_EXT_OBJS", "$(" + EXT + "_GLOBAL_OBJS)");
		ADD_FLAG("STATIC_EXT_OBJS_RESP", "$(" + EXT + "_GLOBAL_OBJS_RESP)");
		ADD_FLAG("STATIC_EXT_LIBS", "$(LIBS_" + EXT + ")");
		ADD_FLAG("STATIC_EXT_LDFLAGS", "$(LDFLAGS_" + EXT + ")");
		ADD_FLAG("STATIC_EXT_CFLAGS", "$(CFLAGS_" + EXT + ")");
		if (is_pgo_desired(extname) && (PHP_PGI == "yes" || PHP_PGO != "no")) {
			if (!static_pgo_enabled) {
				if (PHP_DEBUG != "yes" && PHP_PGI == "yes") {
					ADD_FLAG('STATIC_EXT_LDFLAGS', "/LTCG:PGINSTRUMENT");
				}
				else if (PHP_DEBUG != "yes" && PHP_PGO != "no") {
					ADD_FLAG('STATIC_EXT_LDFLAGS', "/LTCG:PGUPDATE");
				}

				ADD_FLAG("STATIC_EXT_CFLAGS", "/GL /O2");
				static_pgo_enabled = true;
			}
		}

		/* find the header that declares the module pointer,
		 * so we can include it in internal_functions.c */
		var ext_dir = FSO.GetFolder(configure_module_dirname);
		var fc = new Enumerator(ext_dir.Files);
		var re = /\.h$/;
		var s, c;
		for (; !fc.atEnd(); fc.moveNext()) {
			s = fc.item() + "";
			if (s.match(re)) {
				c = file_get_contents(s);
				if (c.match("phpext_")) {
					extension_include_code += '#include "' + configure_module_dirname + '/' + FSO.GetFileName(s) + '"\r\n';
				}
			}
		}

		extension_module_ptrs += '\tphpext_' + extname + '_ptr,\r\n';

		DEFINE('CFLAGS_' + EXT + '_OBJ', '$(CFLAGS_PHP) $(CFLAGS_' + EXT + ')');
	}
	if (MODE_PHPIZE) {
		if (!FSO.FileExists(PHP_DIR + "/include/main/config.pickle.h")) {
			var _tmp = FSO.CreateTextFile(PHP_DIR + "/include/main/config.pickle.h", true);
			_tmp.Close();
		}
	}
	ADD_FLAG("CFLAGS_" + EXT, cflags);

	// [extname, shared, zend]
	extensions_enabled[extensions_enabled.length] = [extname, shared ? 'shared' : 'static', false];
}

function ADD_SOURCES(dir, file_list, target, obj_dir)
{
	var i;
	var tv;
	var src, obj, sym, flags;

	if (target == null) {
		target = "php";
	}

	sym = target.toUpperCase() + "_GLOBAL_OBJS";
	flags = "CFLAGS_" + target.toUpperCase() + '_OBJ';

	var bd = get_define('BUILD_DIR');
	var respd = bd + '\\resp';
	if (!FSO.FolderExists(respd)) {
		FSO.CreateFolder(respd);
	}
	var obj_lst_fn = respd + '\\' + sym + '.txt';
	var resp = "";

	if (configure_subst.Exists(sym)) {
		tv = configure_subst.Item(sym);
	} else {
		if (FSO.FileExists(obj_lst_fn)) {
			FSO.DeleteFile(obj_lst_fn, true);
		}
		tv = "";
	}

	file_list = file_list.split(new RegExp("\\s+"));
	file_list.sort();

	var re = new RegExp("\.[a-z0-9A-Z]+$");

	dir = dir.replace(new RegExp("/", "g"), "\\");
	var objs_line = "";
	var srcs_line = "";

	var sub_build = "$(BUILD_DIR)\\";

	var srcs_by_dir = {};

	/* Parse the file list to create an aggregated structure based on the subdirs passed. */
	for (i in file_list) {
		src = file_list[i];

		var _tmp = src.split("\\");

		var filename = _tmp.pop();

		// build the obj out dir and use it as a key
		var dirname = _tmp.join("\\");

		//WARNING("dir: " + dir + " dirname: " + dirname + " filename: " + filename);

		/* if module dir is not a child of the main source dir,
		 * we need to tweak it; we should have detected such a
		 * case in condense_path and rewritten the path to
		 * be relative.
		 * This probably breaks for non-sibling dirs, but that
		 * is not a problem as buildconf only checks for pecl
		 * as either a child or a sibling */
		if (obj_dir == null) {
			if (MODE_PHPIZE) {
				/* In the phpize mode, the subdirs are always relative to BUID_DIR.
					No need to differentiate by extension, only one gets built. */
				var build_dir = (dirname ? dirname : "").replace(new RegExp("^..\\\\"), "");
			} else {
				var build_dir = (dirname ? (dir + "\\" + dirname) : dir).replace(new RegExp("^..\\\\"), "");
			}
		}
		else {
			var build_dir = (dirname ? obj_dir + "\\" + dirname : obj_dir).replace(new RegExp("^..\\\\"), "");
		}

		obj = sub_build + build_dir + "\\" + filename.replace(re, ".obj");

		if (i > 0) {
			srcs_line += " " + dir + "\\" + src;
			objs_line += " " + obj
		} else {
			srcs_line = dir + "\\" + src;
			objs_line = obj;
		}

		resp += " " + obj.replace('$(BUILD_DIR)', bd);
		tv += " " + obj;

		if (!srcs_by_dir.hasOwnProperty(build_dir)) {
			srcs_by_dir[build_dir] = [];
		}

		/* storing the index from the file_list */
		srcs_by_dir[build_dir].push(i);
	}

	/* Create makefile build targets and dependencies. */
	MFO.WriteLine(objs_line + ": " + srcs_line);

	/* Create target subdirs if any and produce the compiler calls, /mp is respected if enabled. */
	for (var k in srcs_by_dir) {
		var dirs = k.split("\\");
		var i, d = "";
		for (i = 0; i < dirs.length; i++) {
			d += dirs[i];
			build_dirs[build_dirs.length] = d;
			d += "\\";
		}

		var mangle_dir = k.replace(new RegExp("[\\\\/.-]", "g"), "_");
		var bd_flags_name = "CFLAGS_BD_" + mangle_dir.toUpperCase();

		DEFINE(bd_flags_name, "/Fp" + sub_build + d + " /FR" + sub_build + d + " ");
		if (VS_TOOLSET) {
			ADD_FLAG(bd_flags_name, "/Fd" + sub_build + d);
		}

		if (PHP_ANALYZER == "clang") {
			var analyzer_base_args = X64 ? "-m64" : "-m32";
			var analyzer_base_flags = "";

			analyzer_base_args += " --analyze";

			var vc_ver;
			if (VS_TOOLSET) {
				vc_ver = VCVERS;
			} else {
				vc_ver = probe_binary(PATH_PROG('cl', null));
			}

			analyzer_base_args += " -fms-compatibility -fms-compatibility-version=" + vc_ver + " -fms-extensions -Xclang -analyzer-output=text -Xclang -fmodules";
		} else if (PHP_ANALYZER == "cppcheck") {
			var analyzer_base_args = "";
			var analyzer_base_flags = "";

			if (VS_TOOLSET) {
				analyzer_base_flags += " -D _MSC_VER=" + VCVERS;
			} else {
				analyzer_base_flags += " -D _MSC_VER=" + probe_binary(PATH_PROG('cl', null));
			}

			if (X64) {
				analyzer_base_flags += " -D _M_X64 -D _WIN64";
			} else {
				analyzer_base_flags += " -D _M_IX86 ";
			}
			analyzer_base_flags += " -D _WIN32 -D WIN32 -D _WINDOWS";

			var vc_incs = WshShell.Environment("Process").Item("INCLUDE").split(";")
			for (i in vc_incs) {
				if (!vc_incs[i].length) {
					continue;
				}
				analyzer_base_flags += " -I " + "\"" + vc_incs[i] + "\"";
			}

			var cppcheck_platform = X64 ? "win64" : "win32A";
			var cppcheck_lib = "win32\\build\\cppcheck_" + (X64 ? "x64" : "x86") + ".cfg";
			analyzer_base_args += "--enable=warning,performance,portability,information,missingInclude " +
						"--platform=" + cppcheck_platform + " " +
						"--library=windows.cfg --library=microsoft_sal.cfg " +
						"--library=win32\\build\\cppcheck.cfg " +
						"--library=" + cppcheck_lib + " " +
						/* "--rule-file=win32\build\cppcheck_rules.xml " + */
						" --std=c89 --std=c++11 " +
						"--quiet --inconclusive --template=vs -j 4 " +
						"--suppress=unmatchedSuppression " +
						"--suppressions-list=win32\\build\\cppcheck_suppress.txt ";

			var cppcheck_build_dir = get_define("CPPCHECK_BUILD_DIR");
			if (!!cppcheck_build_dir) {
				analyzer_base_args += "--cppcheck-build-dir=$(CPPCHECK_BUILD_DIR)";
			}
		}

		if (PHP_MP_DISABLED) {
			for (var j in srcs_by_dir[k]) {
				src = file_list[srcs_by_dir[k][j]];

				var _tmp = src.split("\\");
				var filename = _tmp.pop();
				obj = filename.replace(re, ".obj");

				MFO.WriteLine("\t" + CMD_MOD1 + "$(CC) $(" + flags + ") $(CFLAGS) $(" + bd_flags_name + ") /c " + dir + "\\" + src + " /Fo" + sub_build + d + obj);

				if ("clang" == PHP_ANALYZER) {
					MFO.WriteLine("\t" + CMD_MOD1 + "\"$(CLANG_CL)\" " + analyzer_base_args + " $(" + flags + "_ANALYZER) $(CFLAGS_ANALYZER) $(" + bd_flags_name + "_ANALYZER) " + dir + "\\" + src);
				} else if ("cppcheck" == PHP_ANALYZER) {
					MFO.WriteLine("\t\"" + CMD_MOD1 + "$(CPPCHECK)\" " + analyzer_base_args + " $(" + flags + "_ANALYZER) $(CFLAGS_ANALYZER) $(" + bd_flags_name + "_ANALYZER) " + analyzer_base_flags + " " + dir + "\\" + src);
				}else if (PHP_ANALYZER == "pvs") {
					MFO.WriteLine("\t" + CMD_MOD1 + "\"$(PVS_STUDIO)\" --cl-params $(" + flags + ") $(CFLAGS) $(" + bd_flags_name + ") /c " + dir + "\\" + src + " --source-file "  + dir + "\\" + src
						+ " --cfg PVS-Studio.conf --errors-off \"V122 V117 V111\" ");
				}
			}
		} else {
			/* TODO create a response file at least for the source files to work around the cmd line length limit. */
			var src_line = "";
			for (var j in srcs_by_dir[k]) {
				src_line += dir + "\\" + file_list[srcs_by_dir[k][j]] + " ";
			}

			MFO.WriteLine("\t" + CMD_MOD1 + "$(CC) $(" + flags + ") $(CFLAGS) /Fo" + sub_build + d + " $(" + bd_flags_name + ") /c " + src_line);

			if ("clang" == PHP_ANALYZER) {
				MFO.WriteLine("\t\"$(CLANG_CL)\" " + analyzer_base_args + " $(" + flags + "_ANALYZER) $(CFLAGS_ANALYZER)  $(" + bd_flags_name + "_ANALYZER) " + src_line);
			} else if ("cppcheck" == PHP_ANALYZER) {
				MFO.WriteLine("\t\"$(CPPCHECK)\" " + analyzer_base_args + " $(" + flags + "_ANALYZER) $(CFLAGS_ANALYZER)  $(" + bd_flags_name + "_ANALYZER) " + analyzer_base_flags + " " + src_line);
			}
		}
	}

	DEFINE(sym, tv);

	/* Generate the object response file and define it to the Makefile. This can be
	   useful when getting the "command line too long" linker errors.
	   TODO pack this into a function when response files are used for other kinds of info. */
	var obj_lst_fh = null;
	if (!FSO.FileExists(obj_lst_fn)) {
		obj_lst_fh = FSO.CreateTextFile(obj_lst_fn);
	} else {
		obj_lst_fh = FSO.OpenTextFile(obj_lst_fn, 8);
	}

	obj_lst_fh.Write(" " + resp);
	obj_lst_fh.Close();
	DEFINE(sym + "_RESP", '@"' + obj_lst_fn + '"');
}

function REMOVE_TARGET(dllname, flag)
{
	var dllname = dllname.replace(/\s/g, "");
	var EXT = dllname.replace(/php_(\S+)\.dll/, "$1").toUpperCase();
	var php_flags = configure_subst.Item("CFLAGS_PHP");

	if (configure_subst.Exists(flag)) {
		var targets = configure_subst.Item(flag);

		if (targets.match(dllname)) {
			configure_subst.Remove(flag);
			targets = targets.replace(dllname, "");
			targets = targets.replace(/\s+/, " ");
			targets = targets.replace(/\s$/, "");
			configure_subst.Add(flag, targets);
			configure_hdr.Add("HAVE_" + EXT, new Array(0, ""));
			configure_subst.Item("CFLAGS_PHP") = php_flags.replace(" /D COMPILE_DL_" + EXT, "");
			extensions_enabled.pop();
			return true;
		}
	}
	return false;
}

function generate_internal_functions()
{
	var infile, outfile;
	var indata;

	STDOUT.WriteLine("Generating main/internal_functions.c");

	infile = FSO.OpenTextFile("main/internal_functions.c.in", 1);
	indata = infile.ReadAll();
	infile.Close();

	indata = indata.replace("@EXT_INCLUDE_CODE@", extension_include_code);
	indata = indata.replace("@EXT_MODULE_PTRS@", extension_module_ptrs);

	if (FSO.FileExists("main/internal_functions.c")) {
		var origdata = file_get_contents("main/internal_functions.c");

		if (origdata == indata) {
			STDOUT.WriteLine("\t[content unchanged; skipping]");
			return;
		}
	}

	outfile = FSO.CreateTextFile("main/internal_functions.c", true);
	outfile.Write(indata);
	outfile.Close();
}

function output_as_table(header, ar_out)
{
	var l = header.length;
	var cols = 80;
	var fixedlength = "";
	var t = 0;
	var i,j,k,m;
	var out = "| ";
	var min = new Array(l);
	var max = new Array(l);

	if (!!ar_out[0] && l != ar_out[0].length) {
		STDOUT.WriteLine("Invalid header argument, can't output the table " + l + " " + ar_out[0].length  );
		return;
	}

	for (j=0; j < l; j++) {
		var tmax, tmin;

		/* Figure out the max length per column */
		tmin = 0;
		tmax = 0;
		for (k = 0; k < ar_out.length; k++) {
			if(typeof ar_out[k][j] != 'undefined') {
				var t = ar_out[k][j].length;
				if (t > tmax) tmax = t;
				else if (t < tmin) tmin = t;
			}
		}
		if (tmax > header[j].length) {
			max[j] = tmax;
		} else {
			max[j] = header[j].length;
		}
		if (tmin < header[j].length) {
			min[j] = header[j].length;
		}
	}

	sep = "";
	k = 0;
	for (i = 0; i < l; i++) {
		k += max[i] + 3;
	}
	k++;

	for (j=0; j < k; j++) {
		sep += "-";
	}

	STDOUT.WriteLine(sep);
	out = "|";
	for (j=0; j < l; j++) {
		out += " " + header[j];
		for (var i = 0; i < (max[j] - header[j].length); i++){
			out += " ";
		}
		out += " |";
	}
	STDOUT.WriteLine(out);

	STDOUT.WriteLine(sep);

	out = "|";
	for (i=0; i < ar_out.length; i++) {
		line = ar_out[i];
		for (j=0; j < l; j++) {
			out += " " + line[j];
			if(typeof line[j] != 'undefined') {
				for (var k = 0; k < (max[j] - line[j].length); k++){
					out += " ";
				}
			}
			out += " |";
		}
		STDOUT.WriteLine(out);
		out = "|";
	}

	STDOUT.WriteLine(sep);
}

function write_extensions_summary()
{
	var exts = new Array();
	var zend_exts = new Array();

	for(var x = 0; x < extensions_enabled.length; ++x)
	{
		var l = extensions_enabled[x];

		if(l[2])
		{
			zend_exts.push([l[0], l[1]]);
		}
		else
		{
			exts.push([l[0], l[1]]);
		}
	}

	STDOUT.WriteLine('Enabled extensions:');
	output_as_table(['Extension', 'Mode'], exts.sort());

	if(zend_exts.length)
	{
		STDOUT.WriteBlankLines(2);
		STDOUT.WriteLine('Enabled Zend extensions:');
		output_as_table(['Extension', 'Mode'], zend_exts.sort());
	}
}

function write_summary()
{
	var ar = new Array();
	var k = 0;

	STDOUT.WriteBlankLines(2);
	write_extensions_summary();
	STDOUT.WriteBlankLines(2);
	if (!MODE_PHPIZE) {
		STDOUT.WriteLine("Enabled SAPI:");
		output_as_table(["Sapi Name"], sapi_enabled);
		STDOUT.WriteBlankLines(2);
	}
	ar[k++] = ['Build type', PHP_DEBUG == "yes" ? "Debug" : "Release"];
	ar[k++] = ['Thread Safety', PHP_ZTS == "yes" ? "Yes" : "No"];
	ar[k++] = ['Compiler', COMPILER_NAME_LONG];
	ar[k++] = ['Architecture', X64 ? 'x64' : 'x86'];
	if (PHP_PGO == "yes") {
		ar[k++] = ['Optimization', "PGO"];
	} else if (PHP_PGI == "yes") {
		ar[k++] = ['Optimization', "PGI"];
	} else {
		ar[k++] = ['Optimization', PHP_DEBUG == "yes" ? "disabled" : "PGO disabled"];
	}
	var simd = configure_subst.Item("PHP_SIMD_SCALE");
	if (!!simd) {
		ar[k++] = ["Native intrinsics", simd];
	}
	if (PHP_ANALYZER == "vs") {
		ar[k++] = ['Static analyzer', 'Visual Studio'];
	} else if (PHP_ANALYZER == "clang") {
		ar[k++] = ['Static analyzer', 'clang'];
	} else if (PHP_ANALYZER == "cppcheck") {
		ar[k++] = ['Static analyzer', 'Cppcheck'];
	} else if (PHP_ANALYZER == "pvs") {
		ar[k++] = ['Static analyzer', 'PVS-Studio'];
	} else {
		ar[k++] = ['Static analyzer', 'disabled'];
	}

	output_as_table(["",""], ar);
	STDOUT.WriteBlankLines(2);
}

function is_on_exclude_list_for_test_ini(list, name)
{
	for (var i in list) {
		if (name == list[i]) {
			return true;
		}
	}

	return false;
}

function generate_tmp_php_ini()
{
	if ("no" == PHP_TEST_INI) {
		/* Test ini generation is disabled. */
		return;
	}

	var ini_dir = PHP_OBJECT_OUT_DIR + ("yes" == PHP_DEBUG ? "Debug" : "Release") + ("yes" == PHP_ZTS ? "_TS" : "");
	PHP_TEST_INI_PATH = ini_dir + "\\tmp-php.ini";

	if (FSO.FileExists(PHP_TEST_INI_PATH)) {
		STDOUT.WriteLine("Generating " + PHP_TEST_INI_PATH + " ...");
		var INI = FSO.OpenTextFile(PHP_TEST_INI_PATH, 2);
	} else {
		STDOUT.WriteLine("Regenerating " + PHP_TEST_INI_PATH + " ...");
		var INI = FSO.CreateTextFile(PHP_TEST_INI_PATH, true);
	}

	var ext_list = PHP_TEST_INI_EXT_EXCLUDE.split(",");
	INI.WriteLine("extension_dir=" + ini_dir);
	for (var i in extensions_enabled) {
		if ("shared" != extensions_enabled[i][1]) {
			continue;
		}

		var directive = (extensions_enabled[i][2] ? 'zend_extension' : 'extension');

		var ext_name = extensions_enabled[i][0];

		if (!is_on_exclude_list_for_test_ini(ext_list, ext_name)) {
			INI.WriteLine(directive + "=php_" + ext_name + ".dll");

			if ("opcache" == ext_name) {
				var dir = get_define("BUILD_DIR") + "\\" + "test_file_cache";
				if (FSO.FolderExists(dir)) {
					STDOUT.Write(execute("powershell -Command Remove-Item -path \"\\\\?\\" + dir + "\" -recurse"));
				}
				FSO.CreateFolder(dir);

				/* Fallback is implied, if filecache is enabled. */
				INI.WriteLine("opcache.file_cache=" + dir);
				INI.WriteLine("opcache.enable=1");
				INI.WriteLine("opcache.enable_cli=1");
			}
		}
	}

	INI.Close();
}

function generate_files()
{
	var i, dir, bd, last;

	STDOUT.WriteBlankLines(1);
	STDOUT.WriteLine("Creating build dirs...");
	dir = get_define("BUILD_DIR");
	build_dirs.sort();
	last = null;

	if (!FSO.FolderExists(dir)) {
		FSO.CreateFolder(dir);
	}

	for (i = 0; i < build_dirs.length; i++) {
		bd = FSO.BuildPath(dir, build_dirs[i]);
		if (bd == last) {
			continue;
		}
		last = bd;

		build_dir = get_define('BUILD_DIR');
		build_dir = build_dir.replace(new RegExp("\\\\", "g"), "\\\\");
		if (build_dir.substr(build_dir.Length - 2, 2) != '\\\\') {
			build_dir += '\\\\';
		}
		ADD_FLAG("BUILD_DIRS_SUB", bd.replace(new RegExp(build_dir), ''));

		if (!FSO.FolderExists(bd)) {
			FSO.CreateFolder(bd);
		}
	}

	STDOUT.WriteLine("Generating files...");
	if (!MODE_PHPIZE) {
		generate_tmp_php_ini();
	}
	generate_makefile();
	if (!MODE_PHPIZE) {
		generate_internal_functions();
		generate_config_h();
		generate_phpize();
	} else {
		generate_config_pickle_h();
		generate_ext_pickle();
	}
	STDOUT.WriteLine("Done.");
	STDOUT.WriteBlankLines(1);
	write_summary();

	if (INVALID_CONFIG_ARGS.length) {
		STDOUT.WriteLine('WARNING');
		STDOUT.WriteLine('The following arguments is invalid, and therefore ignored:');

		for (var i = 0; i < INVALID_CONFIG_ARGS.length; ++i) {
			STDOUT.WriteLine(' ' + INVALID_CONFIG_ARGS[i]);
		}

		STDOUT.WriteBlankLines(2);
	}

	if (PHP_SNAPSHOT_BUILD != "no") {
		STDOUT.WriteLine("Type 'nmake snap' to build a PHP snapshot");
	} else {
		STDOUT.WriteLine("Type 'nmake' to build PHP");
	}
}

function generate_ext_pickle()
{
	var content;
	var DEPS = null;
	var dest;
	var deps_lines = new Array();

	var build_var_name = function(name) {
		return "PHP_" + name.toUpperCase();
	}

	STDOUT.WriteLine("Generating pickle deps");
	dest = PHP_DIR + "/script/";

	if (!FSO.FolderExists(dest)) {
		FSO.CreateFolder(dest);
	}

	if (FSO.FileExists(dest + "/ext_pickle.js")) {
		DEPS = FSO.OpenTextFile(dest + "/ext_pickle.js", 1);

		while (!DEPS.AtEndOfStream) {
			var ln = DEPS.ReadLine();
			var found = false;

			for (var i in extensions_enabled) {
				var reg0 = new RegExp(build_var_name(extensions_enabled[i][0]) + "\s*=.+", "g");
				var reg1 = new RegExp(build_var_name(extensions_enabled[i][0]) + "_SHARED" + "\s*=.+", "g");

				if (ln.match(reg1) || ln.match(reg0)) {
					found = true;
					break;
				}
			}

			if (!found) {
				deps_lines.push(ln);
			}
		}
	}

	for (var i in extensions_enabled) {
		deps_lines.push(build_var_name(extensions_enabled[i][0]) + "=true;");
		deps_lines.push(build_var_name(extensions_enabled[i][0]) + "_SHARED=" + (extensions_enabled[i][1] == 'shared' ? 'true' : 'false') + ";");
	}

	if (!!DEPS) {
		DEPS.Close();
		DEPS = null;
	}

	/* Replace the ext_pickle.js with the new content */
	DEPS = FSO.CreateTextFile(dest + "/ext_pickle.js", true);

	for (var j in deps_lines) {
		DEPS.WriteLine(deps_lines[j]);
	}

	DEPS.Close();
}

function generate_config_pickle_h()
{
	var outfile = null;
	var lines = new Array();
	var keys = (new VBArray(configure_hdr.Keys())).toArray();
	dest = PHP_DIR + "/include/main";

	var ignore_key = function(key) {
		var ignores = [ "CONFIGURE_COMMAND", "PHP_COMPILER_ID", "COMPILER", "ARCHITECTURE", "HAVE_STRNLEN", "PHP_DIR" ];

		for (var k in ignores) {
			if (ignores[k] == key) {
				return true;
			}
		}

		return false;
	}


	STDOUT.WriteLine("Generating main/config.pickle.h");

	if (FSO.FileExists(dest + "/config.pickle.h")) {
		outfile = FSO.OpenTextFile(dest + "/config.pickle.h", 1);

		while (!outfile.AtEndOfStream) {
			var found = false;
			var ln = outfile.ReadLine();

			for (var i in keys) {
				var reg = new RegExp("#define[\s ]+" + keys[i] + "[\s ]*.*|#undef[\s ]+" + keys[i], "g");

				if (ln.match(reg)) {
					found = true;
					break;
				}
			}

			if (!found) {
				lines.push(ln);
			}
		}
	}

	for (var i in keys) {
		var item = configure_hdr.Item(keys[i]);

		if (ignore_key(keys[i])) {
			continue;
		}

		/* XXX fix comment handling */
		/*if (!lines[j].match(/^#define.+/g)) {
			continue;
		}*/

		lines.push("#undef " + keys[i]);
		lines.push("#define " + keys[i] + " " + item[0]);
	}

	if (outfile) {
		outfile.Close();
		outfile = null;
	}

	outfile = FSO.CreateTextFile(dest + "/config.pickle.h", true);

	for (var k in lines) {
		outfile.WriteLine(lines[k]);
	}

	outfile.Close();
}

function generate_config_h()
{
	var infile, outfile;
	var indata;
	var prefix;

	prefix = PHP_PREFIX.replace(new RegExp("\\\\", "g"), "\\\\");

	STDOUT.WriteLine("Generating main/config.w32.h");

	infile = FSO.OpenTextFile("win32/build/config.w32.h.in", 1);
	indata = infile.ReadAll();
	infile.Close();

	outfile = FSO.CreateTextFile("main/config.w32.h", true);

	indata = indata.replace(new RegExp("@PREFIX@", "g"), prefix);
	outfile.Write(indata);

	var keys = (new VBArray(configure_hdr.Keys())).toArray();
	var i, j;
	var item;
	var pieces, stuff_to_crack, chunk;

	outfile.WriteBlankLines(1);
	outfile.WriteLine("/* values determined by configure.js */");

	for (i in keys) {
		item = configure_hdr.Item(keys[i]);
		outfile.WriteBlankLines(1);
		pieces = item[0];

		if (item[1] != undefined) {
			outfile.WriteLine("/* " + item[1] + " */");
		}

		if (typeof(pieces) == "string" && pieces.charCodeAt(0) == 34) {
			/* quoted string have a maximal length of 2k under vc.
			 * solution is to crack them and let the compiler concat
			 * them implicitly */
			stuff_to_crack = pieces;
			pieces = "";

			while (stuff_to_crack.length) {
				j = 65;
				while (stuff_to_crack.charCodeAt(j) != 32 && j < stuff_to_crack.length)
					j++;

				chunk = stuff_to_crack.substr(0, j);
				pieces += chunk;
				stuff_to_crack = stuff_to_crack.substr(chunk.length);
				if (stuff_to_crack.length)
					pieces += '" "';
			}
		}

		outfile.WriteLine("#define " + keys[i] + " " + pieces);
	}

	outfile.WriteBlankLines(1);
	outfile.WriteLine("#if __has_include(\"main/config.pickle.h\")");
	outfile.WriteLine("#include \"main/config.pickle.h\"");
	outfile.WriteLine("#endif");

	outfile.Close();
}

/* Generate phpize */
function generate_phpize()
{
	STDOUT.WriteLine("Generating phpize");
	dest = get_define("BUILD_DIR") + '/devel';

	if (!FSO.FolderExists(dest)) {
		FSO.CreateFolder(dest);
	}

	var MF = FSO.CreateTextFile(dest + "/phpize.js", true);
	var DEPS = FSO.CreateTextFile(dest + "/ext_deps.js", true);

	prefix = get_define("PHP_PREFIX");
	prefix = prefix.replace(new RegExp("/", "g"), "\\");
	prefix = prefix.replace(new RegExp("\\\\", "g"), "\\\\");
	MF.WriteLine("var PHP_PREFIX=" + '"' + prefix + '"');
	MF.WriteLine("var PHP_ZTS=" + '"' + (PHP_ZTS.toLowerCase() == "yes" ? "Yes" : "No") + '"');
	MF.WriteLine("var VC_VERSION=" + VCVERS);
	MF.WriteLine("var PHP_VERSION=" + PHP_VERSION);
	MF.WriteLine("var PHP_MINOR_VERSION=" + PHP_MINOR_VERSION);
	MF.WriteLine("var PHP_RELEASE_VERSION=" + PHP_RELEASE_VERSION);
	MF.WriteLine("var PHP_EXTRA_VERSION=\"" + PHP_EXTRA_VERSION + "\"");
	MF.WriteLine("var PHP_VERSION_STRING=\"" + PHP_VERSION_STRING + "\"");
	MF.WriteBlankLines(1);
	MF.WriteLine("/* Generated extensions list with mode (static/shared) */");

	var count = extensions_enabled.length;
	for (i in extensions_enabled) {
		out = "PHP_" + extensions_enabled[i][0].toUpperCase() + "_SHARED=" + (extensions_enabled[i][1] == 'shared' ? 'true' : 'false') + ";";
		DEPS.WriteLine("PHP_" + extensions_enabled[i][0].toUpperCase() + "=true;");
		DEPS.WriteLine(out);
		MF.WriteLine(out);
	}

	MF.WriteBlankLines(2);
	MF.WriteLine("/* Generated win32/build/phpize.js.in */");
	MF.WriteBlankLines(1);
	MF.Write(file_get_contents("win32/build/phpize.js.in"));
	MF.Close();
	DEPS.Close();

	/* Generate flags file */
	/* spit out variable definitions */
	CJ = FSO.CreateTextFile(dest + "/config.phpize.js");

	CJ.WriteLine("var PHP_ZTS =" + '"' + PHP_ZTS + '"');
	CJ.WriteLine("var PHP_DEBUG=" + '"' + PHP_DEBUG + '"');
	CJ.WriteLine("var PHP_DLL_LIB =" + '"' + get_define('PHPLIB') + '"');
	CJ.WriteLine("var PHP_DLL =" + '"' + get_define('PHPDLL') + '"');
	CJ.WriteLine("var PHP_SECURITY_FLAGS =" + '"' + PHP_SECURITY_FLAGS + '"');

	/* The corresponding configure options aren't enabled through phpize,
		thus these dummy declarations are required. */
	CJ.WriteLine("var PHP_ANALYZER =" + '"no"');
	CJ.WriteLine("var PHP_PGO =" + '"no"');
	CJ.WriteLine("var PHP_PGI =" + '"no"');
	CJ.WriteLine("var PHP_ALL_SHARED =" + '"no"');

	CJ.WriteBlankLines(1);
	CJ.Close();
}

function extract_convert_style_line(val, match_sw, to_sw, keep_mkfile_vars)
{
	var ret = "";

	/*var re = new RegExp(match_sw + "(.*)", "g");
	var r;

	while (r = re.execute(val)) {
		WARNING(r);
	}
	return ret;*/

	var cf = val.replace(/\s+/g, " ").split(" ");

	var i_val = false;
	for (var i in cf) {
		var r;

		if (keep_mkfile_vars) {
			r = cf[i].match(/^\$\((.*)\)/);
			if (!!r) {
				ret += " " + r[0];
				continue;
			}
		}

		if (i_val && !!cf[i]) {
			i_val = false;
			ret += " " + to_sw + " " + cf[i];
			continue;
		}

		var re;

		re = new RegExp(match_sw + "(.*)");
		r = cf[i].match(re);
		if (!!r && r.length > 1 && !!r[1]) {
			/* The value is not ws separated from the switch. */
			ret += " " + to_sw + " " + r[1];
			continue;
		}

		r = cf[i].match(match_sw);
		if (!!r) {
			//WARNING(cf[i]);
			/* Value is going to be added in the next iteration. */
			i_val = true;
		}
	}

	return ret;
}

function handle_analyzer_makefile_flags(fd, key, val)
{
	var relevant = false;

	/* VS integrates /analyze with the build process,
		no further action is required. */
	if ("no" == PHP_ANALYZER || "vs" == PHP_ANALYZER) {
		return;
	}

	if (key.match("CFLAGS")) {
		var new_val = val;
		var reg = /\$\(([^\)]+)\)/g;
		var r;
		while (r = reg.exec(val)) {
			var repl = "$(" + r[1] + "_ANALYZER)"
			new_val = new_val.replace(r[0], repl);
		}
		val = new_val;

		if ("clang" == PHP_ANALYZER) {
			val = val.replace(/\/FD /, "")
				.replace(/\/Fp.+? /, "")
				.replace(/\/Fo.+? /, "")
				.replace(/\/Fd.+? /, "")
				//.replace(/\/Fd.+?/, " ")
				.replace(/\/FR.+? /, "")
				.replace("/guard:cf ", "")
				.replace(/\/MP \d+ /, "")
				.replace(/\/MP /, "")
				.replace("/LD ", "")
				.replace("/Qspectre ", "");
		} else if ("cppcheck" == PHP_ANALYZER) {
			new_val = "";

			new_val += extract_convert_style_line(val, "/I", "-I", true);
			new_val += extract_convert_style_line(val, "/D", "-D", false);

			val = new_val;
		}

		relevant = true;
	} else if (key.match("BASE_INCLUDES")) {
		if ("cppcheck" == PHP_ANALYZER) {
			new_val = "";

			new_val += extract_convert_style_line(val, "/I", "-I", true);
			new_val += extract_convert_style_line(val, "/D", "-D", false);

			val = new_val;
		}

		relevant = true;
	}

	if (!relevant) {
		return;
	}

	key += "_ANALYZER";
	//WARNING("KEY: " + key + " VAL: " + val);

	fd.WriteLine(key + "=" + val + " ");
	fd.WriteBlankLines(1);
}

/* Generate the Makefile */
function generate_makefile()
{
	STDOUT.WriteLine("Generating Makefile");
	var MF = FSO.CreateTextFile("Makefile", true);

	MF.WriteLine("# Generated by configure.js");
	/* spit out variable definitions */
	var keys = (new VBArray(configure_subst.Keys())).toArray();
	var i;
	MF.WriteLine("PHP_SRC_DIR =" + PHP_SRC_DIR);
	for (i in keys) {
		// The trailing space is needed to prevent the trailing backslash
		// that is part of the build dir flags (CFLAGS_BD_XXX) from being
		// seen as a line continuation character

		/* \s+\/ eliminates extra whitespace caused when using \ for string continuation,
			whereby \/ is the start of the next compiler switch */
		var val = trim(configure_subst.Item(keys[i])).replace(/\s+\//gm, " /");

		MF.WriteLine(keys[i] + "=" + val + " ");
		MF.WriteBlankLines(1);

		/* If static analyze is enabled, add analyzer specific stuff to the Makefile. */
		handle_analyzer_makefile_flags(MF, keys[i], val);
	}

	if (!MODE_PHPIZE) {
		var val = "yes" == PHP_TEST_INI ? PHP_TEST_INI_PATH : "";
		/* Be sure it's done after generate_tmp_php_ini(). */
		MF.WriteLine("PHP_TEST_INI_PATH=\"" + val + "\"");
	}

	MF.WriteBlankLines(1);
	if (MODE_PHPIZE) {
		var TF = FSO.OpenTextFile(PHP_DIR + "/script/Makefile.phpize", 1);
	} else {
		var TF = FSO.OpenTextFile("win32/build/Makefile", 1);
	}

	MF.Write(TF.ReadAll());

	MF.WriteLine("build-headers:");
	MF.WriteLine("	" + CMD_MOD2 + "if not exist $(BUILD_DIR_DEV)\\include mkdir $(BUILD_DIR_DEV)\\include >nul");
	MF.WriteLine("	" + CMD_MOD2 + "for %D in ($(INSTALL_HEADERS_DIR)) do " + CMD_MOD2 + "if not exist $(BUILD_DIR_DEV)\\include\\%D mkdir $(BUILD_DIR_DEV)\\include\\%D >nul");
	for (i in headers_install) {
		if (headers_install[i][2] != "") {
				MF.WriteLine("	" + CMD_MOD2 + "if not exist $(BUILD_DIR_DEV)\\include\\" + headers_install[i][2] + " mkdir $(BUILD_DIR_DEV)\\include\\" +
												headers_install[i][2] + ">nul");
				MF.WriteLine("	" + CMD_MOD2 + "copy " + headers_install[i][0] + " " + "$(BUILD_DIR_DEV)\\include\\" + headers_install[i][2] + " /y >nul");
		}
	}
	MF.WriteLine("	" + CMD_MOD2 + "for %D in ($(INSTALL_HEADERS_DIR)) do " + CMD_MOD2 + "copy %D*.h $(BUILD_DIR_DEV)\\include\\%D /y >nul");
	if (MODE_PHPIZE) {
		MF.WriteBlankLines(1);
		MF.WriteLine("build-bins:");
		for (var i in extensions_enabled) {
			var lib = "php_" + extensions_enabled[i][0] + ".lib";
			var dll = "php_" + extensions_enabled[i][0] + ".dll";
			MF.WriteLine("	" + CMD_MOD2 + "copy $(BUILD_DIR)\\" + lib + " $(BUILD_DIR_DEV)\\lib");
			MF.WriteLine("  " + CMD_MOD2 + "if not exist $(PHP_PREFIX) mkdir $(PHP_PREFIX) >nul");
			MF.WriteLine("  " + CMD_MOD2 + "if not exist $(PHP_PREFIX)\\ext mkdir $(PHP_PREFIX)\\ext >nul");
			MF.WriteLine("	" + CMD_MOD2 + "copy $(BUILD_DIR)\\" + dll + " $(PHP_PREFIX)\\ext");
		}
	} else {
		MF.WriteBlankLines(1);
		MF.WriteLine("build-ext-libs:");
		MF.WriteLine("	" + CMD_MOD2 + "if not exist $(BUILD_DIR_DEV)\\lib mkdir $(BUILD_DIR_DEV)\\lib >nul");
		for (var i in extensions_enabled) {
			var lib;

			lib = "php_" + extensions_enabled[i][0] + "*.lib";

			if ('shared' == extensions_enabled[i][1]) {
				MF.WriteLine("	" + CMD_MOD2 + "if exist $(BUILD_DIR)\\" + lib + " copy $(BUILD_DIR)\\" + lib + " $(BUILD_DIR_DEV)\\lib");
			}
		}
	}
	TF.Close();

	MF.WriteBlankLines(1);

	var extra_path = "$(PHP_BUILD)\\bin";
	if (PHP_EXTRA_LIBS.length) {
		path = PHP_EXTRA_LIBS.split(';');
		for (i = 0; i < path.length; i++) {
			f = FSO.GetAbsolutePathName(path[i] + "\\..\\bin");
			if (FSO.FolderExists(f)) {
				extra_path = extra_path + ";" + f;
			}
		}
	}
	if (PHP_SANITIZER == "yes") {
		if (CLANG_TOOLSET) {
			extra_path = extra_path + ";" + get_clang_lib_dir() + "\\windows";
		}
	}
	MF.WriteLine("set-tmp-env:");
	MF.WriteLine("	" + CMD_MOD2 + "set PATH=" + extra_path + ";$(PATH)");

	MF.WriteBlankLines(2);

	MF.WriteLine("dump-tmp-env: set-tmp-env");
	MF.WriteLine("	" + CMD_MOD2 + "set");

	MF.WriteBlankLines(2);

	MFO.Close();
	TF = FSO.OpenTextFile("Makefile.objects", 1);
	if (!TF.AtEndOfStream) {
		MF.Write(TF.ReadAll());
	}
	TF.Close();
	MF.WriteBlankLines(2);

	if (FSO.FileExists(PHP_MAKEFILE_FRAGMENTS)) {
		TF = FSO.OpenTextFile(PHP_MAKEFILE_FRAGMENTS, 1);
		if (!TF.AtEndOfStream) {
			MF.Write(TF.ReadAll());
		}
		TF.Close();
		MF.WriteBlankLines(2);
		FSO.DeleteFile(PHP_MAKEFILE_FRAGMENTS, true);
	}

	MF.Close();
}

function ADD_FLAG(name, flags, target)
{
	if (target != null) {
		name = target.toUpperCase() + "_" + name;
	}
	flags = trim(flags);
	if (configure_subst.Exists(name)) {
		var curr_flags = configure_subst.Item(name);

		/* Prefix with a space, thus making sure the
		   current flag is not a substring of some
		   other. It's still not a complete check if
		   some flags with spaces got added.

		   TODO rework to use an array, so direct
		        match can be done. This will also
			help to normalize flags and to not
			to insert duplicates. */
		if (curr_flags.indexOf(" " + flags) >= 0 || curr_flags.indexOf(flags + " ") >= 0) {
			return;
		}

		flags = curr_flags + " " + flags;
		configure_subst.Remove(name);
	}
	configure_subst.Add(name, flags);
}

function get_define(name)
{
	if (configure_subst.Exists(name)) {
		return configure_subst.Item(name);
	}
	return "";
}

// Add a .def to the core to export symbols
function ADD_DEF_FILE(name)
{
	if (!configure_subst.Exists("PHPDEF")) {
		DEFINE("PHPDEF", "$(BUILD_DIR)\\$(PHPDLL).def");
		ADD_FLAG("PHP_LDFLAGS", "/def:$(PHPDEF)");
	}
	ADD_FLAG("PHP_DLL_DEF_SOURCES", name);
}

function AC_DEFINE(name, value, comment, quote)
{
	if (quote == null) {
		quote = true;
	}
	if (quote && typeof(value) == "string") {
		value = '"' + value.replace(new RegExp('(["\\\\])', "g"), '\\$1') + '"';
	} else if (typeof(value) != "undefined" && value.length == 0) {
		value = '""';
	}
	var item = new Array(value, comment);
	if (configure_hdr.Exists(name)) {
		var orig_item = configure_hdr.Item(name);
		STDOUT.WriteLine("AC_DEFINE[" + name + "]=" + value + ": is already defined to " + orig_item[0]);
	} else {
		configure_hdr.Add(name, item);
	}
}

function MESSAGE(msg)
{
	STDOUT.WriteLine("" + msg);
}

function ERROR(msg)
{
	STDERR.WriteLine("ERROR: " + msg);
	WScript.Quit(3);
}

function WARNING(msg)
{
	STDERR.WriteLine("WARNING: " + msg);
	STDERR.WriteBlankLines(1);
}

function copy_and_subst(srcname, destname, subst_array)
{
	if (!FSO.FileExists(srcname)) {
		srcname = configure_module_dirname + "\\" + srcname;
		destname = configure_module_dirname + "\\" + destname;
	}

	var content = file_get_contents(srcname);
	var i;

	for (i = 0; i < subst_array.length; i+=2) {
		var re = subst_array[i];
		var rep = subst_array[i+1];

		content = content.replace(re, rep);
	}

	var f = FSO.CreateTextFile(destname, true);
	f.Write(content);
	f.Close();
}

// glob using simple filename wildcards
// returns an array of matches that are found
// in the filesystem
function glob(path_pattern)
{
	var path_parts = path_pattern.replace(new RegExp("/", "g"), "\\").split("\\");
	var p;
	var base = "";
	var is_pat_re = /\*/;

//STDOUT.WriteLine("glob: " + path_pattern);

	if (FSO.FileExists(path_pattern)) {
		return new Array(path_pattern);
	}

	// first, build as much as possible that doesn't have a pattern
	for (p = 0; p < path_parts.length; p++) {
		if (path_parts[p].match(is_pat_re))
			break;
		if (p)
			base += "\\";
		base += path_parts[p];
	}

	return _inner_glob(base, p, path_parts);
}

function _inner_glob(base, p, parts)
{
	var pat = parts[p];
	var full_name = base + "\\" + pat;
	var re = null;
	var items = null;

	if (p == parts.length) {
		return false;
	}

//STDOUT.WriteLine("inner: base=" + base + " p=" + p + " pat=" + pat);

	if (FSO.FileExists(full_name)) {
		if (p < parts.length - 1) {
			// we didn't reach the full extent of the pattern
			return false;
		}
		return new Array(full_name);
	}

	if (FSO.FolderExists(full_name) && p == parts.length - 1) {
		// we have reached the end of the pattern; no need to recurse
		return new Array(full_name);
	}

	// Convert the pattern into a regexp
	re = new RegExp("^" + pat.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + "$", "i");

	items = new Array();

	if (!FSO.FolderExists(base)) {
		return false;
	}

	var folder = FSO.GetFolder(base);
	var fc = null;
	var subitems = null;
	var item_name = null;
	var j;

	fc = new Enumerator(folder.SubFolders);
	for (; !fc.atEnd(); fc.moveNext()) {
		item_name = FSO.GetFileName(fc.item());

		if (item_name.match(re)) {
			// got a match; if we are at the end of the pattern, just add these
			// things to the items array
			if (p == parts.length - 1) {
				items[items.length] = fc.item();
			} else {
				// we should recurse and do more matches
				subitems = _inner_glob(base + "\\" + item_name, p + 1, parts);
				if (subitems) {
					for (j = 0; j < subitems.length; j++) {
						items[items.length] = subitems[j];
					}
				}
			}
		}
	}

	// if we are at the end of the pattern, we should match
	// files too
	if (p == parts.length - 1) {
		fc = new Enumerator(folder.Files);
		for (; !fc.atEnd(); fc.moveNext()) {
			item_name = FSO.GetFileName(fc.item());
			if (item_name.match(re)) {
				items[items.length] = fc.item();
			}
		}
	}

	if (items.length == 0)
		return false;

	return items;
}

/* Install Headers */
function PHP_INSTALL_HEADERS(dir, headers_list)
{
	headers_list = headers_list.split(new RegExp("\\s+"));
	headers_list.sort();
	if (dir.length > 0 && dir.substr(dir.length - 1) != '/' && dir.substr(dir.length - 1) != '\\') {
		dir += '/';
	}
	dir = dir.replace(new RegExp("/", "g"), "\\");

	for (i in headers_list) {
		found = false;
		src = headers_list[i];
		src = src.replace(new RegExp("/", "g"), "\\");
		isdir = FSO.FolderExists(dir + src);
		isfile = FSO.FileExists(dir + src);
		if (isdir) {
			if (src.length > 0 && src.substr(src.length - 1) != '/' && src.substr(src.length - 1) != '\\') {
				src += '\\';
			}
			headers_install[headers_install.length] = [dir + src, 'dir',''];
			ADD_FLAG("INSTALL_HEADERS_DIR", dir + src);
			found = true;
		} else if (isfile) {
			dirname = FSO.GetParentFolderName(dir + src);
			headers_install[headers_install.length] = [dir + src, 'file', dirname];
			ADD_FLAG("INSTALL_HEADERS", dir + src);
			found = true;
		} else {
			path =  configure_module_dirname + "\\"+ src;
			isdir = FSO.FolderExists(path);
			isfile = FSO.FileExists(path);
			if (isdir) {
				if (src.length > 0 && src.substr(src.length - 1) != '/' && src.substr(src.length - 1) != '\\') {
					src += '\\';
				}
				headers_install[headers_install.length] = [path, 'dir',''];
				ADD_FLAG("INSTALL_HEADERS_DIR", path);
			} else if (isfile) {
				dirname = FSO.GetParentFolderName(path);
				headers_install[headers_install.length] = [path, 'file', dir];
				ADD_FLAG("INSTALL_HEADERS", dir + src);
				found = true;
			}
		}

		if (found == false) {
			STDOUT.WriteLine(headers_list);
			ERROR("Cannot find header " + dir + src);
		}
	}
}

// For snapshot builders, this option will attempt to enable everything
// and you can then build everything, ignoring fatal errors within a module
// by running "nmake snap"
PHP_SNAPSHOT_BUILD = "no";
if (!MODE_PHPIZE) {
	ARG_ENABLE('snapshot-build', 'Build a snapshot; turns on everything it can and ignores build errors', 'no');
}

function toolset_option_handle()
{
	if ("clang" == PHP_TOOLSET) {
		VS_TOOLSET = false;
		CLANG_TOOLSET = true;
		ICC_TOOLSET = false;
	} else if ("icc" == PHP_TOOLSET) {
		VS_TOOLSET = false;
		CLANG_TOOLSET = false;
		ICC_TOOLSET = true;
	} else {
		/* Visual Studio is the default toolset. */
		PHP_TOOLSET = "no" == PHP_TOOLSET ? "vs" : PHP_TOOLSET;
		if (!!PHP_TOOLSET && "vs" != PHP_TOOLSET) {
			ERROR("Unsupported toolset '" + PHP_TOOLSET + "'");
		}
		VS_TOOLSET = true;
		CLANG_TOOLSET = false;
		ICC_TOOLSET = false;
	}
}

function toolset_setup_compiler()
{
	PHP_CL = toolset_get_compiler();
	if (!PHP_CL) {
		ERROR("Compiler not found");
	}

	COMPILER_NUMERIC_VERSION = toolset_get_compiler_version();
	COMPILER_NAME_LONG = toolset_get_compiler_name();
	COMPILER_NAME_SHORT = toolset_get_compiler_name(true);

	if (VS_TOOLSET) {
		VCVERS = COMPILER_NUMERIC_VERSION;

		if ("unknown" == COMPILER_NAME_LONG) {
			var tmp = probe_binary(PHP_CL);
			COMPILER_NAME_LONG = COMPILER_NAME_SHORT = "MSVC " + tmp + ", untested";

			WARNING("Using unknown MSVC version " + tmp);

			AC_DEFINE('PHP_BUILD_COMPILER', COMPILER_NAME_LONG, "Detected compiler version");
			DEFINE("PHP_COMPILER_SHORT", tmp);
			AC_DEFINE('PHP_COMPILER_ID', tmp, "Compiler compatibility ID");
		} else {
			AC_DEFINE('PHP_BUILD_COMPILER', COMPILER_NAME_LONG, "Detected compiler version");
			DEFINE("PHP_COMPILER_SHORT", COMPILER_NAME_SHORT.toLowerCase());
			AC_DEFINE('PHP_COMPILER_ID', COMPILER_NAME_SHORT.toUpperCase(), "Compiler compatibility ID");
		}
	} else if (CLANG_TOOLSET) {
		CLANGVERS = COMPILER_NUMERIC_VERSION;

		AC_DEFINE('PHP_BUILD_COMPILER', COMPILER_NAME_LONG, "Detected compiler version");
		DEFINE("PHP_COMPILER_SHORT", "clang");
		AC_DEFINE('PHP_COMPILER_ID', "clang"); /* XXX something better were to write here */

	} else if (ICC_TOOLSET) {
		INTELVERS = COMPILER_NUMERIC_VERSION;

		AC_DEFINE('PHP_BUILD_COMPILER', COMPILER_NAME_LONG, "Detected compiler version");
		DEFINE("PHP_COMPILER_SHORT", "icc");
		AC_DEFINE('PHP_COMPILER_ID', "icc"); /* XXX something better were to write here */
	}
	STDOUT.WriteLine("  Detected compiler " + COMPILER_NAME_LONG);
}

function toolset_setup_project_tools()
{
	PATH_PROG('nmake');

	// we don't want to define LIB, as that will override the default library path
	// that is set in that env var
	PATH_PROG('lib', null, 'MAKE_LIB');

	var BISON = PATH_PROG('bison');
	if (BISON) {
		var BISONVERS = probe_binary(BISON, "longversion");
		STDOUT.WriteLine('  Detected bison version ' + BISONVERS);

		if (BISONVERS.match(/^\d+.\d+$/)) {
			BISONVERS += ".0";
		}

		var hm = BISONVERS.match(/(\d+)\.(\d+)\.(\d+)/);
		var nm = MINBISON.match(/(\d+)\.(\d+)\.(\d+)/);

		var intvers =  (hm[1]-0)*10000 + (hm[2]-0)*100 + (hm[3]-0);
		var intmin =  (nm[1]-0)*10000 + (nm[2]-0)*100 + (nm[3]-0);

		if (intvers < intmin) {
			ERROR('The minimum bison version requirement is ' + MINBISON);
		}
	} else {
		ERROR('bison is required')
	}

	if (!PATH_PROG('sed')) {
		ERROR('sed is required')
	}

	var RE2C = PATH_PROG('re2c');
	if (RE2C) {
		var RE2CVERS = probe_binary(RE2C, "version");
		STDOUT.WriteLine('  Detected re2c version ' + RE2CVERS);

		if (RE2CVERS.match(/^\d+.\d+$/)) {
			RE2CVERS += ".0";
		}

		var hm = RE2CVERS.match(/(\d+)\.(\d+)\.(\d+)/);
		var nm = MINRE2C.match(/(\d+)\.(\d+)\.(\d+)/);

		var intvers =  (hm[1]-0)*10000 + (hm[2]-0)*100 + (hm[3]-0);
		var intmin =  (nm[1]-0)*10000 + (nm[2]-0)*100 + (nm[3]-0);

		if (intvers < intmin) {
			ERROR('The minimum RE2C version requirement is ' + MINRE2C);
		}
	} else {
		ERROR('re2c is required')
	}
	PATH_PROG('zip');
	PATH_PROG('lemon');
	PATH_PROG('7za');

	// avoid picking up midnight commander from cygwin
	if (!PATH_PROG('mc', WshShell.Environment("Process").Item("PATH"))) {
		ERROR('mc is required')
	}

	// Try locating the manifest tool
	if (VS_TOOLSET) {
		if (!PATH_PROG('mt', WshShell.Environment("Process").Item("PATH"))) {
			ERROR('mt is required')
		}
	}
}
/* Get compiler if the toolset is supported */
function toolset_get_compiler()
{
	if (VS_TOOLSET) {
		return PATH_PROG('cl', null, 'PHP_CL')
	} else if (CLANG_TOOLSET) {
		return PATH_PROG('clang-cl', null, 'PHP_CL')
	} else if (ICC_TOOLSET) {
		return PATH_PROG('icl', null, 'PHP_CL')
	}

	ERROR("Unsupported toolset");
}

/* Get compiler version if the toolset is supported */
function toolset_get_compiler_version()
{
	var version;

	if (VS_TOOLSET) {
		version = probe_binary(PHP_CL).substr(0, 5).replace('.', '');

		return version;
	} else if (CLANG_TOOLSET) {
		var command = 'cmd /c ""' + PHP_CL + '" -v"';
		var full = execute(command + '" 2>&1"');

		if (full.match(/clang version ([\d\.]+) \((.*)\)/)) {
			version = RegExp.$1;
			version = version.replace(/\./g, '');
			version = version/100 < 1 ? version*10 : version;

			return version;
		}
	} else if (ICC_TOOLSET) {
		var command = 'cmd /c ""' + PHP_CL + '" -v"';
		var full = execute(command + '" 2>&1"');

		if (full.match(/Version (\d+\.\d+\.\d+)/)) {
			version = RegExp.$1;
			version = version.replace(/\./g, '');
			version = version/100 < 1 ? version*10 : version;

			return version;
		}
	}

	ERROR("Failed to parse compiler version or unsupported toolset");
}

/* Get compiler name if the toolset is supported */
function toolset_get_compiler_name(short)
{
	var version;
	short = !!short;

	if (VS_TOOLSET) {
		var name = "unknown";

		version = probe_binary(PHP_CL).substr(0, 5).replace('.', '');

		if (version >= 1930) {
			return name;
		} if (version >= 1920) {
			/* NOTE - VS is intentional. Due to changes in recent Visual Studio
						versioning scheme referring to the exact VC++ version is
						hardly predictable. From this version on, it refers to
						Visual Studio version and implies the default toolset.
						When new versions are introduced, adapt also checks in
						php_win32_image_compatible(), if needed. */
			name = short ? "VS16" : "Visual C++ 2019";
		} else if (version >= 1910) {
			name = short ? "VC15" : "Visual C++ 2017";
		} else if (version >= 1900) {
			name = short ? "VC14" : "Visual C++ 2015";
		} else {
			ERROR("Unsupported Visual C++ compiler " + version);
		}

		return name;
	} else if (CLANG_TOOLSET || ICC_TOOLSET) {
		var command = 'cmd /c ""' + PHP_CL + '" -v"';
		var full = execute(command + '" 2>&1"');

		return full.split(/\n/)[0].replace(/\s/g, ' ');
	}

	WARNING("Unsupported toolset");
}


function toolset_is_64()
{
	if (VS_TOOLSET) {
		return probe_binary(PHP_CL, 64);
	} else if (CLANG_TOOLSET) {
		/*var command = 'cmd /c ""' + PHP_CL + '" -v"';
		var full = execute(command + '" 2>&1"');

		return null != full.match(/x86_64/);*/

		/* Even executed within an environment setup with vcvars32.bat,
		clang-cl doesn't recognize the arch toolset. But as it needs
		the VS environment, checking the arch of cl.exe is correct. */
		return probe_binary(PATH_PROG('cl', null), 64);
	} else if (ICC_TOOLSET) {
		var command = 'cmd /c ""' + PHP_CL + '" -v"';
		var full = execute(command + '" 2>&1"');

		return null != full.match(/Intel\(R\) 64/);
	}

	ERROR("Unsupported toolset");
}

function toolset_setup_arch()
{
	if (X64) {
		STDOUT.WriteLine("  Detected 64-bit compiler");
	} else {
		STDOUT.WriteLine("  Detected 32-bit compiler");
	}
	AC_DEFINE('PHP_BUILD_ARCH', X64 ? 'x64' : 'x86', "Detected compiler architecture");
	DEFINE("PHP_ARCHITECTURE", X64 ? 'x64' : 'x86');
}

function toolset_setup_codegen_arch()
{
	if("no" == PHP_CODEGEN_ARCH || "yes" == PHP_CODEGEN_ARCH) {
		return;
	}

	if (VS_TOOLSET) {
		var arc = PHP_CODEGEN_ARCH.toUpperCase();

		if ("IA32" != arc) {
			ERROR("Only IA32 arch is supported by --with-codegen-arch, got '" + arc + "'");
		} else if (X64) {
			ERROR("IA32 arch is only supported with 32-bit build");
		}
		ADD_FLAG("CFLAGS", "/arch:" + arc);
		PHP_NATIVE_INTRINSICS = "disabled";
	}
}

function toolset_setup_linker()
{
	var lnk = false;
	if (VS_TOOLSET) {
		lnk = PATH_PROG('link', null);
	} else if (CLANG_TOOLSET) {
		//return PATH_PROG('lld', WshShell.Environment("Process").Item("PATH"), "LINK");
		lnk = PATH_PROG('link', WshShell.Environment("Process").Item("PATH"));
	} else if (ICC_TOOLSET) {
		lnk = PATH_PROG('xilink', WshShell.Environment("Process").Item("PATH"), "LINK");
	}

	if (!lnk) {
		ERROR("Unsupported toolset");
	}

	var ver = probe_binary(lnk);

	var major = ver.substr(0, 2);
	var minor = ver.substr(3, 2);

	AC_DEFINE('PHP_LINKER_MAJOR', major, "Linker major version", false);
	AC_DEFINE('PHP_LINKER_MINOR', minor, "Linker minor version", false);

	return lnk;
}

function toolset_setup_common_cflags()
{
	var envCFLAGS = WshShell.Environment("PROCESS").Item("CFLAGS");

	// CFLAGS for building the PHP dll
	DEFINE("CFLAGS_PHP", "/D _USRDLL /D PHP7DLLTS_EXPORTS /D PHP_EXPORTS \
	/D LIBZEND_EXPORTS /D TSRM_EXPORTS /D SAPI_EXPORTS /D WINVER=" + WINVER);

	DEFINE('CFLAGS_PHP_OBJ', '$(CFLAGS_PHP) $(STATIC_EXT_CFLAGS)');

	// General CFLAGS for building objects
	DEFINE("CFLAGS", "/nologo $(BASE_INCLUDES) /D _WINDOWS /D WINDOWS=1 \
		/D ZEND_WIN32=1 /D PHP_WIN32=1 /D WIN32 /D _MBCS \
		/D _USE_MATH_DEFINES");

	if (envCFLAGS) {
		ADD_FLAG("CFLAGS", envCFLAGS);
	}

	if (VS_TOOLSET) {
		ADD_FLAG("CFLAGS", " /FD ");

		// fun stuff: MS deprecated ANSI stdio and similar functions
		// disable annoying warnings.  In addition, time_t defaults
		// to 64-bit.  Ask for 32-bit.
		if (X64) {
			ADD_FLAG('CFLAGS', ' /wd4996 ');
		} else {
			ADD_FLAG('CFLAGS', ' /wd4996 /D_USE_32BIT_TIME_T=1 ');
		}

		if (PHP_DEBUG == "yes") {
			// Set some debug/release specific options
			ADD_FLAG('CFLAGS', ' /RTC1 ');
		} else {
			if (PHP_DEBUG == "no" && PHP_SECURITY_FLAGS == "yes") {
				/* Mitigations for CVE-2017-5753.
			  	   TODO backport for all supported VS versions when they release it. */
				if (VCVERS >= 1912) {
					var subver1912 = probe_binary(PHP_CL).substr(6);
					if (VCVERS >= 1913 || 1912 == VCVERS && subver1912 >= 25835) {
						ADD_FLAG('CFLAGS', "/Qspectre");
					} else {
						/* Undocumented. */
						ADD_FLAG('CFLAGS', "/d2guardspecload");
					}
				} else if (1900 == VCVERS) {
					var subver1900 = probe_binary(PHP_CL).substr(6);
					if (subver1900 >= 24241) {
						ADD_FLAG('CFLAGS', "/Qspectre");
					}
				}
			}
			if (VCVERS >= 1900) {
				if (PHP_SECURITY_FLAGS == "yes") {
					ADD_FLAG('CFLAGS', "/guard:cf");
				}
			}
			if (VCVERS >= 1800) {
				if (PHP_PGI != "yes" && PHP_PGO != "yes") {
					ADD_FLAG('CFLAGS', "/Zc:inline");
				}
				/* We enable /opt:icf only with the debug pack, so /Gw only makes sense there, too. */
				if (PHP_DEBUG_PACK == "yes") {
					ADD_FLAG('CFLAGS', "/Gw");
				}
			}
		}

		if (VCVERS >= 1914) {
			/* This is only in effect for CXX sources, __cplusplus is not defined in C sources. */
			ADD_FLAG("CFLAGS", "/Zc:__cplusplus");
		}

		if (VCVERS >= 1914) {
			ADD_FLAG("CFLAGS", "/d2FuncCache1");
		}

		ADD_FLAG("CFLAGS", "/Zc:wchar_t");
	} else if (CLANG_TOOLSET) {
		if (X64) {
			ADD_FLAG('CFLAGS', '-m64');
		} else {
			ADD_FLAG('CFLAGS', '-m32');
		}
		ADD_FLAG("CFLAGS", " /fallback ");
		ADD_FLAG("CFLAGS", "-Xclang -fmodules");

		var vc_ver = probe_binary(PATH_PROG('cl', null));
		ADD_FLAG("CFLAGS"," -fms-compatibility -fms-compatibility-version=" + vc_ver + " -fms-extensions");
	}
}

function toolset_setup_intrinsic_cflags()
{
	var default_enabled = "sse2";
	/* XXX AVX and above needs to be reflected in /arch, for now SSE4.2 is
		the best possible optimization.*/
	var avail = WScript.CreateObject("Scripting.Dictionary");
	avail.Add("sse", "__SSE__");
	avail.Add("sse2", "__SSE2__");
	avail.Add("sse3", "__SSE3__");
	avail.Add("ssse3", "__SSSE3__");
	avail.Add("sse4.1", "__SSE4_1__");
	avail.Add("sse4.2", "__SSE4_2__");
	/* From oldest to newest. */
	var scale = new Array("sse", "sse2", "sse3", "ssse3", "sse4.1", "sse4.2", "avx", "avx2");

	if (VS_TOOLSET) {
		if ("disabled" == PHP_NATIVE_INTRINSICS) {
			ERROR("Can't enable intrinsics, --with-codegen-arch passed with an incompatible option. ")
		}

		if ("no" == PHP_NATIVE_INTRINSICS || "yes" == PHP_NATIVE_INTRINSICS) {
			PHP_NATIVE_INTRINSICS = default_enabled;
		}

		if ("all" == PHP_NATIVE_INTRINSICS) {
			var list = (new VBArray(avail.Keys())).toArray();

			for (var i in list) {
				AC_DEFINE(avail.Item(list[i]), 1);
			}

			/* All means all. __AVX__ and __AVX2__ are defined by compiler. */
			ADD_FLAG("CFLAGS","/arch:AVX2");
			configure_subst.Add("PHP_SIMD_SCALE", "AVX2");
		} else {
			var list = PHP_NATIVE_INTRINSICS.split(",");
			var j = 0;
			for (var k = 0; k < scale.length; k++) {
				for (var i = 0; i < list.length; i++) {
					var it = list[i].toLowerCase();
					if (scale[k] == it) {
						j = k > j ? k : j;
					} else if (!avail.Exists(it) && "avx2" != it && "avx" != it) {
						WARNING("Unknown intrinsic name '" + it + "' ignored");
					}
				}
			}
			if (!X64) {
				/* SSE2 is currently the default on 32-bit. It could change later,
					for now no need to pass it. But, if SSE only was chosen,
					/arch:SSE is required. */
				if ("sse" == scale[j]) {
					ADD_FLAG("CFLAGS","/arch:SSE");
				}
			}
			configure_subst.Add("PHP_SIMD_SCALE", scale[j].toUpperCase());
			/* There is no explicit way to enable intrinsics between SSE3 and SSE4.2.
				The declared macros therefore won't affect the code generation,
				but will enable the guarded code parts. */
			if ("avx2" == scale[j]) {
				ADD_FLAG("CFLAGS","/arch:AVX2");
				j -= 2;
			} else if ("avx" == scale[j]) {
				ADD_FLAG("CFLAGS","/arch:AVX");
				j -= 1;
			}
			for (var i = 0; i <= j; i++) {
				var it = scale[i];
				AC_DEFINE(avail.Item(it), 1);
			}
		}
	}
}

function toolset_setup_common_ldlags()
{
	var envLDFLAGS = WshShell.Environment("PROCESS").Item("LDFLAGS");

	// General DLL link flags
	DEFINE("DLL_LDFLAGS", "/dll ");

	// PHP DLL link flags
	DEFINE("PHP_LDFLAGS", "$(DLL_LDFLAGS)");

	DEFINE("LDFLAGS", "/nologo ");

	if (envLDFLAGS) {
		ADD_FLAG("LDFLAGS", envLDFLAGS);
	}

	// we want msvcrt in the PHP DLL
	ADD_FLAG("PHP_LDFLAGS", "/nodefaultlib:libcmt");

	if (VS_TOOLSET) {
		if (VCVERS >= 1900) {
			if (PHP_SECURITY_FLAGS == "yes") {
				ADD_FLAG('LDFLAGS', "/GUARD:CF");
			}
		}
		if (PHP_VS_LINK_COMPAT != "no") {
			// Allow compatible IL versions, do not require an exact match.
			// Prevents build failures where different libs were built with different (but compatible) IL versions.
			// See fatal error C1047.
			ADD_FLAG("LDFLAGS", "/d2:-AllowCompatibleILVersions ");
		}
	}
}

function toolset_setup_common_libs()
{
	// urlmon.lib ole32.lib oleaut32.lib uuid.lib gdi32.lib winspool.lib comdlg32.lib
	DEFINE("LIBS", "kernel32.lib ole32.lib user32.lib advapi32.lib shell32.lib ws2_32.lib Dnsapi.lib psapi.lib bcrypt.lib");
}

function toolset_setup_build_mode()
{
	if (PHP_DEBUG == "yes") {
		ADD_FLAG("CFLAGS", "/LDd /MDd /Od /D _DEBUG /D ZEND_DEBUG=1 " +
			(X64?"/Zi":"/ZI"));
		ADD_FLAG("LDFLAGS", "/debug");
		// Avoid problems when linking to release libraries that use the release
		// version of the libc
		ADD_FLAG("PHP_LDFLAGS", "/nodefaultlib:msvcrt");
	} else {
		// Generate external debug files when --enable-debug-pack is specified
		if (PHP_DEBUG_PACK == "yes") {
			ADD_FLAG("CFLAGS", "/Zi");
			ADD_FLAG("LDFLAGS", "/incremental:no /debug /opt:ref,icf");
		}
		ADD_FLAG("CFLAGS", "/LD /MD");
		if (PHP_SANITIZER == "yes" && CLANG_TOOLSET) {
			ADD_FLAG("CFLAGS", "/Od /D NDebug /D NDEBUG /D ZEND_WIN32_NEVER_INLINE /D ZEND_DEBUG=0");
		} else {
			// Equivalent to Release_TSInline build -> best optimization
			ADD_FLAG("CFLAGS", "/Ox /D NDebug /D NDEBUG /GF /D ZEND_DEBUG=0");
		}

		// if you have VS.Net /GS hardens the binary against buffer overruns
		// ADD_FLAG("CFLAGS", "/GS");
	}
}

function object_out_dir_option_handle()
{
	if (PHP_OBJECT_OUT_DIR.length) {
		PHP_OBJECT_OUT_DIR = FSO.GetAbsolutePathName(PHP_OBJECT_OUT_DIR);
		if (!FSO.FolderExists(PHP_OBJECT_OUT_DIR)) {
			ERROR('chosen output directory ' + PHP_OBJECT_OUT_DIR + ' does not exist');
		}
		PHP_OBJECT_OUT_DIR += '\\';
	} else {
		PHP_OBJECT_OUT_DIR = FSO.GetAbsolutePathName(".") + '\\';

		if (X64) {
			PHP_OBJECT_OUT_DIR += 'x64\\';
			if (!FSO.FolderExists(PHP_OBJECT_OUT_DIR)) {
				FSO.CreateFolder(PHP_OBJECT_OUT_DIR);
			}
		}
	}
}

function setup_zts_stuff()
{
	if (PHP_ZTS == "yes") {
		ADD_FLAG("CFLAGS", "/D ZTS=1");
		ADD_FLAG("ZTS", "1");
	} else {
		ADD_FLAG("ZTS", "0");
	}

	DEFINE("PHP_ZTS_ARCHIVE_POSTFIX", PHP_ZTS == "yes" ? '' : "-nts");

	// set up the build dir and DLL name
	if (PHP_DEBUG == "yes" && PHP_ZTS == "yes") {
		DEFINE("BUILD_DIR", PHP_OBJECT_OUT_DIR + "Debug_TS");
		if (!MODE_PHPIZE) {
			DEFINE("PHPDLL", "php" + PHP_VERSION + "ts_debug.dll");
			DEFINE("PHPLIB", "php" + PHP_VERSION + "ts_debug.lib");
		}
	} else if (PHP_DEBUG == "yes" && PHP_ZTS == "no") {
		DEFINE("BUILD_DIR", PHP_OBJECT_OUT_DIR + "Debug");
		if (!MODE_PHPIZE) {
			DEFINE("PHPDLL", "php" + PHP_VERSION + "_debug.dll");
			DEFINE("PHPLIB", "php" + PHP_VERSION + "_debug.lib");
		}
	} else if (PHP_DEBUG == "no" && PHP_ZTS == "yes") {
		DEFINE("BUILD_DIR", PHP_OBJECT_OUT_DIR + "Release_TS");
		if (!MODE_PHPIZE) {
			DEFINE("PHPDLL", "php" + PHP_VERSION + "ts.dll");
			DEFINE("PHPLIB", "php" + PHP_VERSION + "ts.lib");
		}
	} else if (PHP_DEBUG == "no" && PHP_ZTS == "no") {
		DEFINE("BUILD_DIR", PHP_OBJECT_OUT_DIR + "Release");
		if (!MODE_PHPIZE) {
			DEFINE("PHPDLL", "php" + PHP_VERSION + ".dll");
			DEFINE("PHPLIB", "php" + PHP_VERSION + ".lib");
		}
	}

	if (!FSO.FolderExists(get_define('BUILD_DIR'))) {
		FSO.CreateFolder(get_define('BUILD_DIR'));
	}
}

function php_build_option_handle()
{
	if (PHP_PHP_BUILD == 'no') {
		if (FSO.FolderExists("..\\deps")) {
			PHP_PHP_BUILD = "..\\deps";
		} else {
			if (FSO.FolderExists("..\\php_build")) {
				PHP_PHP_BUILD = "..\\php_build";
			} else {
				if (X64) {
					if (FSO.FolderExists("..\\win64build")) {
						PHP_PHP_BUILD = "..\\win64build";
					} else if (FSO.FolderExists("..\\php-win64-dev\\php_build")) {
						PHP_PHP_BUILD = "..\\php-win64-dev\\php_build";
					}
				} else {
					if (FSO.FolderExists("..\\win32build")) {
						PHP_PHP_BUILD = "..\\win32build";
					} else if (FSO.FolderExists("..\\php-win32-dev\\php_build")) {
						PHP_PHP_BUILD = "..\\php-win32-dev\\php_build";
					}
				}
			}
		}
		PHP_PHP_BUILD = FSO.GetAbsolutePathName(PHP_PHP_BUILD);
	}
	DEFINE("PHP_BUILD", PHP_PHP_BUILD);
}

// Poke around for some headers
function probe_basic_headers()
{
	var p;

	if (PHP_PHP_BUILD != "no") {
		php_usual_include_suspects += ";" + PHP_PHP_BUILD + "\\include";
		php_usual_lib_suspects += ";" + PHP_PHP_BUILD + "\\lib";
	}
}

function add_extra_dirs()
{
	var path, i, f;

	if (PHP_EXTRA_INCLUDES.length) {
		path = PHP_EXTRA_INCLUDES.split(';');
		for (i = 0; i < path.length; i++) {
			f = FSO.GetAbsolutePathName(path[i]);
			if (FSO.FolderExists(f)) {
				ADD_FLAG("CFLAGS", '/I "' + f + '" ');
			}
		}
	}
	if (PHP_EXTRA_LIBS.length) {
		path = PHP_EXTRA_LIBS.split(';');
		for (i = 0; i < path.length; i++) {
			f = FSO.GetAbsolutePathName(path[i]);
			if (FSO.FolderExists(f)) {
				if (VS_TOOLSET && VCVERS <= 1200 && f.indexOf(" ") >= 0) {
					ADD_FLAG("LDFLAGS", '/libpath:"\\"' + f + '\\"" ');
					ADD_FLAG("ARFLAGS", '/libpath:"\\"' + f + '\\"" ');
				} else {
					ADD_FLAG("LDFLAGS", '/libpath:"' + f + '" ');
					ADD_FLAG("ARFLAGS", '/libpath:"' + f + '" ');
				}
			}
		}
	}

}

function trim(s)
{
	return s.replace(/^\s+/, "").replace(/\s+$/, "");
}

function force_all_shared()
{
	return !!PHP_ALL_SHARED && "yes" == PHP_ALL_SHARED;
}

function ADD_MAKEFILE_FRAGMENT(src_file)
{
	var fn_in;

	if ("undefined" == typeof(src_file)) {
		fn_in = configure_module_dirname + "\\Makefile.frag.w32";
	} else {
		fn_in = src_file;
	}

	if (FSO.FileExists(fn_in)) {
		var h_in, h_out;
		var create_out_fl = !FSO.FileExists(PHP_MAKEFILE_FRAGMENTS);
		var open_flags = create_out_fl ? 2 : 8;

		h_in = FSO.OpenTextFile(fn_in, 1);
		h_out = FSO.OpenTextFile(PHP_MAKEFILE_FRAGMENTS, open_flags, create_out_fl);

		if (!h_in.AtEndOfStream) {
			h_out.Write(h_in.ReadAll());
			h_out.WriteBlankLines(1);
		}

		h_in.Close();
		h_out.Close();
	}
}

function SETUP_OPENSSL(target, path_to_check, common_name, use_env, add_dir_part, add_to_flag_only)
{
	var ret = 0;
	var cflags_var = "CFLAGS_" + target.toUpperCase();

	if (CHECK_LIB("libcrypto.lib", target, path_to_check) &&
			CHECK_LIB("libssl.lib", target, path_to_check) &&
			CHECK_LIB("crypt32.lib", target, path_to_check, common_name) &&
			CHECK_HEADER_ADD_INCLUDE("openssl/ssl.h", cflags_var, path_to_check, use_env, add_dir_part, add_to_flag_only)) {
		/* Openssl 1.1.x */
		return 2;
	} else if (CHECK_LIB("ssleay32.lib", target, path_to_check, common_name) &&
			CHECK_LIB("libeay32.lib", target, path_to_check, common_name) &&
			CHECK_LIB("crypt32.lib", target, path_to_check, common_name) &&
			CHECK_HEADER_ADD_INCLUDE("openssl/ssl.h", cflags_var, path_to_check, use_env, add_dir_part, add_to_flag_only)) {
		/* Openssl 1.0.x and lower */
		return 1;
	}

	return ret;
}

function SETUP_SQLITE3(target, path_to_check, shared) {
	var cflags_var = "CFLAGS_" + target.toUpperCase();
	var libs = (shared ? "libsqlite3.lib;libsqlite3_a.lib" : "libsqlite3_a.lib;libsqlite3.lib");

	return CHECK_LIB(libs, target, path_to_check) &&
		CHECK_HEADER_ADD_INCLUDE("sqlite3.h", cflags_var) &&
		CHECK_HEADER_ADD_INCLUDE("sqlite3ext.h", cflags_var);
}

function check_binary_tools_sdk()
{
	var BIN_TOOLS_SDK_VER_MAJOR = 0;
	var BIN_TOOLS_SDK_VER_MINOR = 0;
	var BIN_TOOLS_SDK_VER_PATCH = 0;

	var out = execute("cmd /c phpsdk_version");

	if (out.match(/PHP SDK (\d+)\.(\d+)\.(\d+).*/)) {
		BIN_TOOLS_SDK_VER_MAJOR = parseInt(RegExp.$1);
		BIN_TOOLS_SDK_VER_MINOR = parseInt(RegExp.$2);
		BIN_TOOLS_SDK_VER_PATCH = parseInt(RegExp.$3);
	}

	/* Basic test, extend by need. */
	if (BIN_TOOLS_SDK_VER_MAJOR < 2) {
		ERROR("Incompatible binary tools version. Please consult\r\nhttps://wiki.php.net/internals/windows/stepbystepbuild_sdk_2");
	}
}

function get_clang_lib_dir()
{
	var ret = null;
	var ver = null;

	if (COMPILER_NAME_LONG.match(/clang version ([\d\.]+) \((.*)\)/)) {
		ver = RegExp.$1;
	} else {
		ERROR("Failed to determine clang lib path");
	}

	if (X64) {
		ret = PROGRAM_FILES + "\\LLVM\\lib\\clang\\" + ver + "\\lib";
		if (!FSO.FolderExists(ret)) {
			ret = null;
		}
	} else {
		ret = PROGRAM_FILESx86 + "\\LLVM\\lib\\clang\\" + ver + "\\lib";
		if (!FSO.FolderExists(ret)) {
			ret = PROGRAM_FILES + "\\LLVM\\lib\\clang\\" + ver + "\\lib";
			if (!FSO.FolderExists(ret)) {
				ret = null;
			}
		}
	}

	if (null == ret) {
		ERROR("Invalid clang lib path encountered");
	}

	return ret;
}

function add_asan_opts(cflags_name, libs_name, ldflags_name)
{

	var ver = null;

	if (COMPILER_NAME_LONG.match(/clang version ([\d\.]+) \((.*)\)/)) {
		ver = RegExp.$1;
	} else {
		ERROR("Failed to determine clang lib path");
	}

	if (!!cflags_name) {
		ADD_FLAG(cflags_name, "-fsanitize=address,undefined");
	}
	if (!!libs_name) {
		if (X64) {
			ADD_FLAG(libs_name, "clang_rt.asan_dynamic-x86_64.lib clang_rt.asan_dynamic_runtime_thunk-x86_64.lib");
		} else {
			ADD_FLAG(libs_name, "clang_rt.asan_dynamic-i386.lib clang_rt.asan_dynamic_runtime_thunk-i386.lib");
		}
	}

	if (!!ldflags_name) {
		ADD_FLAG(ldflags_name, "/libpath:\"" + get_clang_lib_dir() + "\\windows\"");
	}
}

function setup_verbosity()
{
	if ("no" != PHP_VERBOSITY) {
		if ("yes" == PHP_VERBOSITY) {
			VERBOSITY = 1;
			if (1 == VERBOSITY) {
				CMD_MOD1 = "";
			}
		} else {
			var _tmp = parseInt(PHP_VERBOSITY);
			if (0 != _tmp && 1 != _tmp && 2 != _tmp) {
				ERROR("Unsupported verbosity level '" + PHP_VERBOSITY + "'");
			}
			VERBOSITY = _tmp;

			if (1 == VERBOSITY) {
				CMD_MOD1 = "";
			}
			if (2 == VERBOSITY) {
				CMD_MOD1 = "";
				CMD_MOD2 = "";
			}
		}
	} else {
		VERBOSITY = 0;
		CMD_MOD1 = "@";
		CMD_MOD2 = "@";
	}
}

try {
	ARG_ENABLE('vs-link-compat', 'Allow linking of libraries built with compatible versions of VS toolset', 'yes');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
core_module_list = new Array(
"TSRM",
"apache2handler",
"cgi",
"cli",
"embed",
"phpdbg",
"bcmath",
"bz2",
"calendar",
"com-dotnet",
"ctype",
"curl",
"date",
"dba",
"dl-test",
"dom",
"enchant",
"exif",
"ffi",
"fileinfo",
"filter",
"ftp",
"gd",
"gettext",
"gmp",
"hash",
"iconv",
"imap",
"intl",
"json",
"ldap",
"libxml",
"mbstring",
"mysqli",
"mysqlnd",
"oci8",
"odbc",
"opcache",
"openssl",
"pcre",
"pdo",
"pdo-dblib",
"pdo-firebird",
"pdo-mysql",
"pdo-oci",
"pdo-odbc",
"pdo-pgsql",
"pdo-sqlite",
"pgsql",
"phar",
"pspell",
"readline",
"reflection",
"session",
"shmop",
"simplexml",
"snmp",
"soap",
"sockets",
"sodium",
"spl",
"sqlite3",
"standard",
"sysvshm",
"tidy",
"tokenizer",
"xml",
"xmlreader",
"xmlwriter",
"xsl",
"zend-test",
"zip",
"zlib",
false // dummy
);
try {
ARG_WITH("verbosity", "Output verbosity, 0-2.", "1");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("toolset", "Toolset to use for the compilation, give: vs, clang, icc. " +
		"The only recommended and supported toolset for production use " +
		"is Visual Studio. Use others at your own risk.", "vs");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('cygwin', 'Path to cygwin utilities on your system', '\\cygwin');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('object-out-dir', 'Alternate location for binary objects during build', '');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('debug', 'Compile with debugging symbols', "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('debug-pack', 'Release binaries with external debug symbols (--enable-debug must not be specified)', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('pgi', 'Generate PGO instrumented binaries', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('pgo', 'Compile optimized binaries using training data from folder', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('zts', 'Thread safety', 'yes');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('prefix', 'where PHP will be installed', '');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('mp', 'Tell Visual Studio use up to [n,auto,disable] processes for compilation', 'auto');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('php-build', 'Path to where you extracted the development libraries (http://wiki.php.net/internals/windows/libs). Assumes that it is a sibling of this source dir (..\\deps) if not specified', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('extra-includes', 'Extra include path to use when building everything', '');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('extra-libs', 'Extra library path to use when linking everything', '');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("analyzer", "Enable static analyzer. Pass vs for Visual Studio, clang for clang, cppcheck for Cppcheck, pvs for PVS-Studio", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("ipv6", "Disable IPv6 support (default is turn it on if available)", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('fd-setsize', "Set maximum number of sockets for select(2)", "256");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("snapshot-template", "Path to snapshot builder template dir", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("security-flags", "Disable the compiler security flags", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("uncritical-warn-choke", "Disable some uncritical warnings", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("sanitizer", "Enable ASan and UBSan extensions", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("codegen-arch", "Architecture for code generation: ia32. Use --enable-native-intrinsics to enable SIMD optimizations.", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("all-shared", "Force all the non obligatory extensions to be shared", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('config-profile', 'Name of the configuration profile to save this to in php-src/config.name.bat', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("test-ini", "Enable automatic php.ini generation. The test.ini will be put \
		into the build dir and used to automatically load the shared extensions.", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("test-ini-ext-exclude", "Comma separated list of shared extensions to \
		be excluded from the test.ini", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("native-intrinsics", "Comma separated list of intrinsic optimizations to enable. \
	Available instruction set names are sse, sse2, sse3, ssse3, sse4.1, sse4.2, avx, avx2. \
	SSE and SSE2 are enabled by default. The best instruction set specified will \
	automatically enable all the older instruction sets. Note, that the produced binary \
	might not work properly, if the chosen instruction sets are not available on the target \
	processor.", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('apache2handler', 'Build Apache 2.x handler', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('apache2-2handler', 'Build Apache 2.2.x handler', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('apache2-4handler', 'Build Apache 2.4.x handler', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('cgi', 'Build CGI version of PHP', 'yes');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('cli', 'Build CLI version of PHP', 'yes');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('cli-win32', 'Build console-less CLI version of PHP', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('embed', 'Embedded SAPI library', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('phpdbg', 'Build phpdbg', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('phpdbgs', 'Build phpdbg shared', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("bcmath", "bc style precision math functions", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("bz2", "BZip2", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("calendar", "calendar conversion support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("com-dotnet", "COM and .Net support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("ctype", "ctype", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("curl", "cURL support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("dba", "DBA support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("qdbm", "DBA: QDBM support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("db", "DBA: Berkeley DB support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("lmdb", "DBA: Lightning memory-mapped database support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("dl-test", "enable dl_test extension", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("enchant", "Enchant Support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('ffi', 'ffi support', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("fileinfo", "fileinfo support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("filter", "Filter Support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("ftp", "ftp support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("gd", "Bundled GD support", "yes,shared");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("libwebp", "webp support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("libavif", "avif support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("gettext", "gettext support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("gmp", "Include GNU MP support.", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH('mhash', 'mhash support (BC via hash)', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("iconv", "iconv support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("imap", "IMAP Support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("intl", "Enable internationalization support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("ldap", "LDAP support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("mbstring", "multibyte string functions", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("mbregex", "multibyte regex support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("mysqlnd", "Mysql Native Client Driver", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("oci8", "OCI8 support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("oci8-11g", "OCI8 support using Oracle 11g Instant Client", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("oci8-12c", "OCI8 support using Oracle Database 12c Instant Client", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("oci8-19", "OCI8 support using Oracle Database 19 Instant Client", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("odbc", "ODBC support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("odbcver", "Force support for the passed ODBC version. A hex number is expected, default 0x0350. Use the special value of 0 to prevent an explicit ODBCVER to be defined.", "0x0350");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("opcache", "whether to enable Zend OPcache support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("opcache-jit", "whether to enable JIT", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("openssl", "OpenSSL support", "no,shared");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pcre-jit", "Enable PCRE JIT support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pgsql", "PostgreSQL support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pspell", "pspell/aspell (whatever it's called this month) support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("readline", "Readline support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("session", "session support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("shmop", "shmop support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("snmp", "SNMP support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("sockets", "SOCKETS support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("sodium", "for libsodium support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("sqlite3", "SQLite 3 support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("password-argon2", "Argon2 support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("config-file-scan-dir", "Dir to check for additional php ini files", "");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('sysvshm', 'SysV Shared Memory support', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("tidy", "TIDY support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("tokenizer", "tokenizer support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("zend-test", "enable zend_test extension", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("zip", "ZIP support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("zlib", "ZLIB support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("libxml", "LibXML support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("dom", "DOM support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE('exif', 'Exchangeable image information (EXIF) Support', 'no');
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("mysqli", "MySQLi support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("pdo", "Enable PHP Data Objects support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-dblib", "freetds dblib (Sybase, MS-SQL) support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-mssql", "Native MS-SQL support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-firebird", "Firebird support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-mysql", "MySQL support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-oci", "Oracle OCI support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-odbc", "ODBC support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-pgsql", "PostgreSQL support for PDO", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("pdo-sqlite", "for pdo_sqlite support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("phar", "disable phar support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("phar-native-ssl", "enable phar with native OpenSSL support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("simplexml", "Simple XML support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("soap", "SOAP support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("xml", "XML support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("xmlreader", "XMLReader support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_ENABLE("xmlwriter", "XMLWriter support", "yes");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}
try {
ARG_WITH("xsl", "xsl support", "no");
} catch (e) {
	STDOUT.WriteLine("problem: " + e);
}

check_binary_tools_sdk();

STDOUT.WriteLine("PHP Version: " + PHP_VERSION_STRING);
STDOUT.WriteBlankLines(1);
conf_process_args();

// vim:ft=javascript
// "Master" config file; think of it as a configure.ac
// equivalent.

/* ARG_WITH("verbosity", "Output verbosity, 0-2.", "1"); */
setup_verbosity();

/* ARG_WITH("toolset", "Toolset to use for the compilation, give: vs, clang, icc. " +
		"The only recommended and supported toolset for production use " +
		"is Visual Studio. Use others at your own risk.", "vs"); */
toolset_option_handle();

/* ARG_WITH('cygwin', 'Path to cygwin utilities on your system', '\\cygwin'); */

toolset_setup_compiler();

// do we use x64 or 80x86 version of compiler?
X64 = toolset_is_64();
toolset_setup_arch();

toolset_setup_linker();
toolset_setup_project_tools();

// stick objects somewhere outside of the source tree
/* ARG_ENABLE('object-out-dir', 'Alternate location for binary objects during build', ''); */
object_out_dir_option_handle();

/* ARG_ENABLE('debug', 'Compile with debugging symbols', "no"); */
/* ARG_ENABLE('debug-pack', 'Release binaries with external debug symbols (--enable-debug must not be specified)', 'no'); */
if (PHP_DEBUG == "yes" && PHP_DEBUG_PACK == "yes") {
	ERROR("Use of both --enable-debug and --enable-debug-pack not allowed.");
}

if (PHP_DEBUG == "yes") {
	ADD_FLAG("CFLAGS"," /Wall ");
	ADD_FLAG("LDFLAGS", " /verbose ");
}

/* ARG_ENABLE('pgi', 'Generate PGO instrumented binaries', 'no'); */
/* ARG_WITH('pgo', 'Compile optimized binaries using training data from folder', 'no'); */
if (PHP_PGI == "yes" || PHP_PGO != "no") {
	PGOMGR = PATH_PROG('pgomgr', WshShell.Environment("Process").Item("PATH"));
	if (!PGOMGR) {
		ERROR("--enable-pgi and --with-pgo options can only be used if PGO capable compiler is present.");
	}
	if (PHP_PGI == "yes" && PHP_PGO != "no") {
		ERROR("Use of both --enable-pgi and --with-pgo not allowed.");
	}
}

/* ARG_ENABLE('zts', 'Thread safety', 'yes'); */
// Configures the hard-coded installation dir
/* ARG_WITH('prefix', 'where PHP will be installed', ''); */
if (PHP_PREFIX == '') {
	PHP_PREFIX = "C:\\php";
	if (PHP_DEBUG == "yes")
		PHP_PREFIX += "\\debug";
}
DEFINE('PHP_PREFIX', PHP_PREFIX);

DEFINE("BASE_INCLUDES", "/I . /I main /I Zend /I TSRM /I ext ");

toolset_setup_common_cflags();

if (VS_TOOLSET) {
	/* ARG_WITH('mp', 'Tell Visual Studio use up to [n,auto,disable] processes for compilation', 'auto'); */
	var PHP_MP_DISABLED = true;

	if (PHP_MP != 'disable') {
		if(PHP_DEBUG == 'yes') {
			STDOUT.WriteLine('WARNING: Debug builds cannot be built using multi processing');
		} else {
			// no from disable-all
			if(PHP_MP == 'auto' || PHP_MP == 'no') {
				ADD_FLAG('CFLAGS', ' /MP ');
				PHP_MP_DISABLED = false;
			} else {
				if(parseInt(PHP_MP) != 0) {
					ADD_FLAG('CFLAGS', ' /MP'+ PHP_MP +' ');
					PHP_MP_DISABLED = false;
				} else {
					STDOUT.WriteLine('WARNING: Invalid argument for MP: ' + PHP_MP);
				}
			}
		}
	}

	if (!PHP_MP_DISABLED) {
		STDOUT.WriteLine('Enabling multi process build');
	}
}

// General link flags
toolset_setup_common_ldlags();

// General libs
toolset_setup_common_libs();

// Set some debug/release specific options
toolset_setup_build_mode();

setup_zts_stuff();

// CFLAGS, LDFLAGS and BUILD_DIR are defined
// Add compiler and link flags if PGO options are selected
if (PHP_DEBUG != "yes" && PHP_PGI == "yes") {
	ADD_FLAG("STATIC_EXT_CFLAGS", "/GL /O2");
	DEFINE("PGOPGD_DIR", "$(BUILD_DIR)");
}
else if (PHP_DEBUG != "yes" && PHP_PGO != "no") {
	ADD_FLAG("STATIC_EXT_CFLAGS", "/GL /O2");
	DEFINE("PGOPGD_DIR", ((PHP_PGO.length == 0 || PHP_PGO == "yes") ? "$(BUILD_DIR)" : PHP_PGO));
}

// Find the php_build dir - it contains headers and libraries
// that we need
/* ARG_WITH('php-build', 'Path to where you extracted the development libraries (http://wiki.php.net/internals/windows/libs). Assumes that it is a sibling of this source dir (..\\deps) if not specified', 'no'); */
php_build_option_handle();

/* ARG_WITH('extra-includes', 'Extra include path to use when building everything', ''); */
/* ARG_WITH('extra-libs', 'Extra library path to use when linking everything', ''); */

var php_usual_include_suspects = PHP_PHP_BUILD+"\\include";
var php_usual_lib_suspects = PHP_PHP_BUILD+"\\lib";

ADD_FLAG("CFLAGS", '/I "' + php_usual_include_suspects + '" ');
ADD_FLAG("LDFLAGS", '/libpath:"' + php_usual_lib_suspects + '" ');
ADD_FLAG("ARFLAGS", '/nologo /libpath:"' + php_usual_lib_suspects + '" ');

probe_basic_headers();
add_extra_dirs();

//DEFINE("PHP_BUILD", PHP_PHP_BUILD);

/* ARG_WITH("analyzer", "Enable static analyzer. Pass vs for Visual Studio, clang for clang, cppcheck for Cppcheck, pvs for PVS-Studio", "no"); */
if (PHP_ANALYZER == "vs") {
	ADD_FLAG("CFLAGS", " /analyze ");
	ADD_FLAG("CFLAGS", " /wd6308 ");
} else if (PHP_ANALYZER == "clang") {
	var clang_cl = false;

	if (FSO.FileExists(PROGRAM_FILES + "\\LLVM\\bin\\clang-cl.exe")) {
		clang_cl = PROGRAM_FILES + "\\LLVM\\bin\\clang-cl.exe";
	} else if (FSO.FileExists(PROGRAM_FILESx86 + "\\LLVM\\bin\\clang-cl.exe")) {
		clang_cl = PROGRAM_FILESx86 + "\\LLVM\\bin\\clang-cl.exe";
	}

	if (!clang_cl) {
		if (false == PATH_PROG('clang-cl', null, 'CLANG_CL')) {
			WARNING("Couldn't find clang binaries, static analyze was disabled");
			PHP_ANALYZER = "no";
		}
	} else {
		DEFINE("CLANG_CL", clang_cl);
	}
} else if (PHP_ANALYZER == "cppcheck") {

	var cppcheck = false;

	if (FSO.FileExists(PROGRAM_FILES + "\\Cppcheck\\cppcheck.exe")) {
		cppcheck = PROGRAM_FILES + "\\Cppcheck\\cppcheck.exe";
	} else if (FSO.FileExists(PROGRAM_FILESx86 + "\\Cppcheck\\cppcheck.exe")) {
		cppcheck = PROGRAM_FILESx86 + "\\Cppcheck\\cppcheck.exe";
	}
	if (!cppcheck) {
		if (false == PATH_PROG('cppcheck', null, 'CPPCHECK')) {
			WARNING("Couldn't find Cppcheck binaries, static analyze was disabled");
			PHP_ANALYZER = "no";
		} else {
			cppcheck = get_define("CPPCHECK");
		}
	} else {
		DEFINE("CPPCHECK", cppcheck);
	}

	if (cppcheck) {
		var _tmp = execute(cppcheck + " --version").split(/ /)[1];
		var cppcheck_ver = [
			parseInt(_tmp.split(".")[0]),
			parseInt(_tmp.split(".")[1]),
		];
		if (cppcheck_ver[0] > 1 || cppcheck_ver[0] == 1 && cppcheck_ver[1] >= 77) {
			var build_dir = get_define("BUILD_DIR");
			var cppcheck_build_dir = build_dir + "\\cppcheck_build";
			if (!FSO.FolderExists(cppcheck_build_dir)) {
				FSO.CreateFolder(cppcheck_build_dir);
			}
			DEFINE("CPPCHECK_BUILD_DIR", cppcheck_build_dir);
		}
	}

} else if (PHP_ANALYZER == "pvs") {
	var pvs_studio = false;

	if (FSO.FileExists(PROGRAM_FILES + "\\PVS-Studio\\x64\\PVS-Studio.exe")) {
		pvs_studio = PROGRAM_FILES + "\\PVS-Studio\\x86\\PVS-Studio.exe";
	} else if (FSO.FileExists(PROGRAM_FILESx86 + "\\PVS-Studio\\x64\\PVS-Studio.exe")) {
		pvs_studio = PROGRAM_FILESx86 + "\\PVS-Studio\\x64\\PVS-Studio.exe";
	}

	if (!pvs_studio) {
		WARNING("Couldn't find PVS-Studio binaries, static analyze was disabled");
		PHP_ANALYZER = "no";
	} else {
		var pvscfg = FSO.CreateTextFile("PVS-Studio.conf", true);
		DEFINE("PVS_STUDIO", pvs_studio);

		pvscfg.WriteLine("exclude-path = " + VCINSTALLDIR);
		if (FSO.FolderExists(PROGRAM_FILESx86 + "\\windows kits\\")) {
			pvscfg.WriteLine("exclude-path = " + PROGRAM_FILESx86 + "\\windows kits\\");
		} else if (FSO.FolderExists(PROGRAM_FILES + "\\windows kits\\")) {
			pvscfg.WriteLine("exclude-path = " + PROGRAM_FILES + "\\windows kits\\");
		}
		pvscfg.WriteLine("vcinstalldir = " + VCINSTALLDIR);
		pvscfg.WriteLine("platform = " + (X64 ? 'x64' : 'Win32'));
		pvscfg.WriteLine("preprocessor = visualcpp");
		pvscfg.WriteLine("language = C");
		pvscfg.WriteLine("skip-cl-exe = no");
	}
} else {
	PHP_ANALYZER = "no"
}

STDOUT.WriteBlankLines(1);
STDOUT.WriteLine("Build dir: " + get_define('BUILD_DIR'));
STDOUT.WriteLine("PHP Core:  " + get_define('PHPDLL') + " and " + get_define('PHPLIB'));

ADD_SOURCES("Zend", "zend_language_parser.c zend_language_scanner.c \
	zend_ini_parser.c zend_ini_scanner.c zend_alloc.c zend_compile.c \
	zend_constants.c zend_exceptions.c \
	zend_execute_API.c zend_highlight.c \
	zend_llist.c zend_vm_opcodes.c zend_opcode.c zend_operators.c zend_ptr_stack.c \
	zend_stack.c zend_variables.c zend.c zend_API.c zend_extensions.c \
	zend_hash.c zend_list.c zend_builtin_functions.c zend_attributes.c \
	zend_ini.c zend_sort.c zend_multibyte.c \
	zend_stream.c zend_iterators.c zend_interfaces.c zend_objects.c \
	zend_object_handlers.c zend_objects_API.c \
	zend_default_classes.c zend_execute.c zend_strtod.c zend_gc.c zend_closures.c zend_weakrefs.c \
	zend_float.c zend_string.c zend_generators.c zend_virtual_cwd.c zend_ast.c \
	zend_inheritance.c zend_smart_str.c zend_cpuinfo.c zend_observer.c zend_system_id.c \
	zend_enum.c zend_fibers.c");
ADD_SOURCES("Zend\\Optimizer", "zend_optimizer.c pass1.c pass3.c optimize_func_calls.c block_pass.c optimize_temp_vars_5.c nop_removal.c compact_literals.c zend_cfg.c zend_dfg.c dfa_pass.c zend_ssa.c zend_inference.c zend_func_info.c zend_call_graph.c zend_dump.c escape_analysis.c compact_vars.c dce.c sccp.c scdf.c");

var FIBER_ASSEMBLER = X64 ? PATH_PROG('ML64') : PATH_PROG('ML');
DEFINE('FIBER_ASSEMBLER', FIBER_ASSEMBLER);

var FIBER_ASM_ARCH = X64 ? 'x86_64' : 'i386';
DEFINE('FIBER_ASM_ARCH', FIBER_ASM_ARCH);

ADD_FLAG('LDFLAGS', '$(BUILD_DIR)\\Zend\\jump_' + FIBER_ASM_ARCH + '_ms_pe_masm.obj');
ADD_FLAG('LDFLAGS', '$(BUILD_DIR)\\Zend\\make_' + FIBER_ASM_ARCH + '_ms_pe_masm.obj');

ADD_MAKEFILE_FRAGMENT('win32/build/Makefile.frag.w32');

ADD_FLAG("CFLAGS_BD_ZEND", "/D ZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
if (VS_TOOLSET && VCVERS >= 1914) {
	ADD_FLAG("CFLAGS_BD_ZEND", "/d2FuncCache1");
}

/* XXX inspect this for other toolsets */
//AC_DEFINE('ZEND_DVAL_TO_LVAL_CAST_OK', 1);

ADD_SOURCES("main", "main.c snprintf.c spprintf.c getopt.c fopen_wrappers.c \
	php_scandir.c php_ini.c SAPI.c rfc1867.c php_content_types.c strlcpy.c \
	strlcat.c reentrancy.c php_variables.c php_ticks.c network.c \
	php_open_temporary_file.c output.c internal_functions.c \
	php_syslog.c");
ADD_FLAG("CFLAGS_BD_MAIN", "/D ZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
if (VS_TOOLSET && VCVERS >= 1914) {
	ADD_FLAG("CFLAGS_BD_MAIN", "/d2FuncCache1");
}

AC_DEFINE('HAVE_STRNLEN', 1);

ADD_SOURCES("main/streams", "streams.c cast.c memory.c filter.c plain_wrapper.c \
	userspace.c transports.c xp_socket.c mmap.c glob_wrapper.c");
ADD_FLAG("CFLAGS_BD_MAIN_STREAMS", "/D ZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
if (VS_TOOLSET && VCVERS >= 1914) {
	ADD_FLAG("CFLAGS_BD_MAIN_STREAMS", "/d2FuncCache1");
}

ADD_SOURCES("win32", "dllmain.c glob.c readdir.c \
	registry.c select.c sendmail.c time.c winutil.c wsyslog.c globals.c \
	getrusage.c ftok.c ioutil.c codepage.c nice.c \
	inet.c fnmatch.c sockets.c console.c signal.c");

ADD_FLAG("CFLAGS_BD_WIN32", "/D ZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
if (VS_TOOLSET && VCVERS >= 1914) {
	ADD_FLAG("CFLAGS_BD_WIN32", "/d2FuncCache1");
}

PHP_INSTALL_HEADERS("", "Zend/ TSRM/ main/ main/streams/ win32/");
PHP_INSTALL_HEADERS("Zend/Optimizer", "zend_call_graph.h zend_cfg.h zend_dump.h zend_func_info.h zend_inference.h zend_optimizer.h zend_ssa.h");

STDOUT.WriteBlankLines(1);


/* Can we build with IPv6 support? */
/* ARG_ENABLE("ipv6", "Disable IPv6 support (default is turn it on if available)", "yes"); */

var main_network_has_ipv6 = 0;
if (PHP_IPV6 == "yes") {
	main_network_has_ipv6 = CHECK_HEADER_ADD_INCLUDE("wspiapi.h", "CFLAGS") ? 1 : 0;
}
if (main_network_has_ipv6) {
	STDOUT.WriteLine("Enabling IPv6 support");
	AC_DEFINE('HAVE_GAI_STRERROR', 1);
	AC_DEFINE('HAVE_IPV6', 1);
}

/* this allows up to 256 sockets to be select()ed in a single
 * call to select(), instead of the usual 64 */
/* ARG_ENABLE('fd-setsize', "Set maximum number of sockets for select(2)", "256"); */
ADD_FLAG("CFLAGS", "/D FD_SETSIZE=" + parseInt(PHP_FD_SETSIZE));

/* For snapshot builders, where can we find the additional
 * files that make up the snapshot template? */
/* ARG_WITH("snapshot-template", "Path to snapshot builder template dir", "no"); */

if (PHP_SNAPSHOT_TEMPLATE == "no") {
	/* default is as a sibling of the php_build dir */
	if (FSO.FolderExists(PHP_PHP_BUILD + "\\template")) {
		PHP_SNAPSHOT_TEMPLATE = FSO.GetAbsolutePathName(PHP_PHP_BUILD + "\\template");
	} else if (FSO.FolderExists(PHP_PHP_BUILD + "\\..\\template")) {
		PHP_SNAPSHOT_TEMPLATE = FSO.GetAbsolutePathName(PHP_PHP_BUILD + "\\..\\template");
	}
}

DEFINE('SNAPSHOT_TEMPLATE', PHP_SNAPSHOT_TEMPLATE);

/* ARG_ENABLE("security-flags", "Disable the compiler security flags", "yes"); */
if (PHP_SECURITY_FLAGS == "yes") {
	ADD_FLAG("LDFLAGS", "/NXCOMPAT /DYNAMICBASE ");
}

if (CLANG_TOOLSET) {
	/* ARG_WITH("uncritical-warn-choke", "Disable some uncritical warnings", "yes"); */
	if (PHP_UNCRITICAL_WARN_CHOKE != "no") {
		ADD_FLAG("CFLAGS", "-Wno-ignored-attributes -Wno-deprecated-declarations -Wno-missing-braces " +
		"-Wno-logical-op-parentheses -Wno-msvc-include -Wno-invalid-source-encoding -Wno-unknown-pragmas " +
		"-Wno-unused-command-line-argument -Wno-unused-function -Wno-ignored-pragma-optimize");
	}

	/* ARG_ENABLE("sanitizer", "Enable ASan and UBSan extensions", "no"); */
	if (PHP_SANITIZER == "yes") {
		if (COMPILER_NUMERIC_VERSION < 500) {
			ERROR("Clang at least 5.0.0 required for sanitation plugins");
		}
		add_asan_opts("CFLAGS", "LIBS", "LDFLAGS");
	}
}

/* ARG_WITH("codegen-arch", "Architecture for code generation: ia32. Use --enable-native-intrinsics to enable SIMD optimizations.", "no"); */
toolset_setup_codegen_arch();

/* ARG_WITH("all-shared", "Force all the non obligatory extensions to be shared", "no"); */

// Config profiles (--with-config-profile=<name>) will save a certain config to php-src/config.<name>.bat
// so that it can be executed like: cofig.<name> instead of a long list of parameters
//
// Note, nice as a name is disallowed and will generate a warning and skip saving
/* ARG_WITH('config-profile', 'Name of the configuration profile to save this to in php-src/config.name.bat', 'no'); */

/* ARG_ENABLE("test-ini", "Enable automatic php.ini generation. The test.ini will be put \
		into the build dir and used to automatically load the shared extensions.", "yes"); */

/* ARG_WITH("test-ini-ext-exclude", "Comma separated list of shared extensions to \
		be excluded from the test.ini", "no"); */

/* ARG_ENABLE("native-intrinsics", "Comma separated list of intrinsic optimizations to enable. \
	Available instruction set names are sse, sse2, sse3, ssse3, sse4.1, sse4.2, avx, avx2. \
	SSE and SSE2 are enabled by default. The best instruction set specified will \
	automatically enable all the older instruction sets. Note, that the produced binary \
	might not work properly, if the chosen instruction sets are not available on the target \
	processor.", "no"); */
toolset_setup_intrinsic_cflags();
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\TSRM\\config.w32'));
// vim:ft=javascript

ADD_SOURCES("TSRM", "TSRM.c tsrm_win32.c");
ADD_FLAG("CFLAGS_BD_TSRM", "/D ZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\sapi\\apache2handler\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('apache2handler', 'Build Apache 2.x handler', 'no'); */

if (PHP_APACHE2HANDLER != "no") {
	if (PHP_ZTS == "no") {
		WARNING("Apache 2.0 module requires an --enable-zts build of PHP on windows");
	} else if (CHECK_HEADER_ADD_INCLUDE("httpd.h", "CFLAGS_APACHE2HANDLER", PHP_PHP_BUILD + "\\include\\apache2") &&
			CHECK_LIB("libhttpd.lib", "apache2handler", PHP_PHP_BUILD + "\\lib\\apache2") &&
			CHECK_LIB("libapr.lib", "apache2handler", PHP_PHP_BUILD + "\\lib\\apache2") &&
			CHECK_LIB("libaprutil.lib", "apache2handler", PHP_PHP_BUILD + "\\lib\\apache2")
			) {
		SAPI('apache2handler', 'mod_php.c sapi_apache2.c apache_config.c php_functions.c',
				'php' + PHP_VERSION + 'apache2.dll',
				'/D PHP_APACHE2_EXPORTS /I win32 /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	} else {
		WARNING("Could not find apache2 libraries/headers");
	}
}

/* ARG_ENABLE('apache2-2handler', 'Build Apache 2.2.x handler', 'no'); */

if (PHP_APACHE2_2HANDLER != "no") {
	if (PHP_ZTS == "no") {
		WARNING("Apache 2.2 module requires an --enable-zts build of PHP on windows");
	} else if (CHECK_HEADER_ADD_INCLUDE("httpd.h", "CFLAGS_APACHE2_2HANDLER", PHP_PHP_BUILD + "\\include\\apache2_2") &&
			CHECK_LIB("libhttpd.lib", "apache2_2handler", PHP_PHP_BUILD + "\\lib\\apache2_2") &&
			CHECK_LIB("libapr-1.lib", "apache2_2handler", PHP_PHP_BUILD + "\\lib\\apache2_2") &&
			CHECK_LIB("libaprutil-1.lib", "apache2_2handler", PHP_PHP_BUILD + "\\lib\\apache2_2")
			) {
		SAPI('apache2_2handler', 'mod_php.c sapi_apache2.c apache_config.c php_functions.c',
				'php' + PHP_VERSION + 'apache2_2.dll',
				'/D PHP_APACHE2_EXPORTS /I win32 /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1',
				'sapi\\apache2_2handler');
	} else {
		WARNING("Could not find apache2.2 libraries/headers");
	}
}

/* ARG_ENABLE('apache2-4handler', 'Build Apache 2.4.x handler', 'no'); */
if (PHP_APACHE2_4HANDLER != "no") {
	if (PHP_ZTS == "no") {
		WARNING("Apache 2.4 module requires an --enable-zts build of PHP on windows");
	} else if (CHECK_HEADER_ADD_INCLUDE("httpd.h", "CFLAGS_APACHE2_4HANDLER", PHP_PHP_BUILD + "\\include\\apache2_4") &&
			CHECK_LIB("libhttpd.lib", "apache2_4handler", PHP_PHP_BUILD + "\\lib\\apache2_4") &&
			CHECK_LIB("libapr-1.lib", "apache2_4handler", PHP_PHP_BUILD + "\\lib\\apache2_4") &&
			CHECK_LIB("libaprutil-1.lib", "apache2_4handler", PHP_PHP_BUILD + "\\lib\\apache2_4")
			) {
		SAPI('apache2_4handler', 'mod_php.c sapi_apache2.c apache_config.c php_functions.c',
				'php' + PHP_VERSION + 'apache2_4.dll',
				'/D PHP_APACHE2_EXPORTS /I win32 /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1',
				'sapi\\apache2handler');
	} else {
		WARNING("Could not find apache 2.4 libraries/headers");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\sapi\\cgi\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('cgi', 'Build CGI version of PHP', 'yes'); */

if (PHP_CGI == "yes") {
	ADD_FLAG("LDFLAGS_CGI", "/stack:67108864");
	SAPI('cgi', 'cgi_main.c', 'php-cgi.exe', '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	ADD_SOURCES('main', 'fastcgi.c', 'cgi');
	ADD_FLAG('LIBS_CGI', 'ws2_32.lib kernel32.lib advapi32.lib');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\sapi\\cli\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('cli', 'Build CLI version of PHP', 'yes'); */
/* ARG_ENABLE('cli-win32', 'Build console-less CLI version of PHP', 'no'); */

if (PHP_CLI == "yes") {
	SAPI('cli', 'php_cli.c php_http_parser.c php_cli_server.c php_cli_process_title.c ps_title.c', 'php.exe', '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	ADD_FLAG("LIBS_CLI", "ws2_32.lib");
	ADD_FLAG("LIBS_CLI", "shell32.lib");
	ADD_FLAG("LDFLAGS_CLI", "/stack:67108864");

	if (CHECK_LIB("edit_a.lib;edit.lib", "cli", PHP_CLI) &&
		CHECK_HEADER_ADD_INCLUDE("editline/readline.h", "CFLAGS_CLI")) {
		ADD_FLAG("CFLAGS_CLI", "/D HAVE_LIBEDIT");
	}
}

if (PHP_CLI_WIN32 == "yes") {
	SAPI('cli_win32', 'cli_win32.c php_cli_process_title.c ps_title.c', 'php-win.exe', '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	ADD_FLAG("LDFLAGS_CLI_WIN32", "/stack:67108864");
	ADD_FLAG("LIBS_CLI_WIN32", "shell32.lib");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\sapi\\embed\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('embed', 'Embedded SAPI library', 'no'); */

var PHP_EMBED_PGO = false;

if (PHP_EMBED != "no") {
	SAPI('embed', 'php_embed.c', 'php' + PHP_VERSION + 'embed.lib', '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	PHP_INSTALL_HEADERS("sapi/embed", "php_embed.h");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\sapi\\phpdbg\\config.w32'));
/* ARG_ENABLE('phpdbg', 'Build phpdbg', 'no'); */
/* ARG_ENABLE('phpdbgs', 'Build phpdbg shared', 'no'); */

PHPDBG_SOURCES='phpdbg.c phpdbg_prompt.c phpdbg_cmd.c phpdbg_info.c phpdbg_help.c phpdbg_break.c ' +
		'phpdbg_print.c phpdbg_bp.c phpdbg_list.c phpdbg_utils.c ' +
		'phpdbg_set.c phpdbg_frame.c phpdbg_watch.c phpdbg_win.c phpdbg_btree.c '+
		'phpdbg_parser.c phpdbg_lexer.c phpdbg_sigsafe.c phpdbg_io.c phpdbg_out.c';
PHPDBG_DLL='php' + PHP_VERSION + 'phpdbg.dll';
PHPDBG_EXE='phpdbg.exe';
PHPDBG_CFLAGS='/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1';

var PHP_PHPDBG_PGO = false;
var PHP_PHPDBGS_PGO = false;

if (PHP_PHPDBG == "yes") {
	SAPI('phpdbg', PHPDBG_SOURCES, PHPDBG_EXE, PHPDBG_CFLAGS);
	ADD_FLAG("LIBS_PHPDBG", "ws2_32.lib user32.lib");
	ADD_FLAG("CFLAGS_PHPDBG", "/D YY_NO_UNISTD_H");
	ADD_FLAG("LDFLAGS_PHPDBG", "/stack:8388608");
}

if (PHP_PHPDBGS == "yes") {
	SAPI('phpdbgs', PHPDBG_SOURCES, PHPDBG_DLL, '/D PHP_PHPDBG_EXPORTS /I win32');
	ADD_FLAG("LIBS_PHPDBGS", "ws2_32.lib user32.lib");
	ADD_FLAG("CFLAGS_PHPDBGS", "/D YY_NO_UNISTD_H");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\bcmath\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("bcmath", "bc style precision math functions", "yes"); */

if (PHP_BCMATH == "yes") {
	EXTENSION("bcmath", "bcmath.c",	null, "-Iext/bcmath/libbcmath/src /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	ADD_SOURCES("ext/bcmath/libbcmath/src", "add.c div.c init.c neg.c \
		raisemod.c sub.c compare.c divmod.c int2num.c \
		num2long.c output.c recmul.c sqrt.c zero.c debug.c doaddsub.c \
		nearzero.c num2str.c raise.c rmzero.c str2num.c", "bcmath");

	AC_DEFINE('HAVE_BCMATH', 1, 'Have BCMATH library');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\bz2\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("bz2", "BZip2", "no"); */

if (PHP_BZ2 != "no") {
	if (CHECK_LIB("libbz2_a.lib;libbz2.lib", "bz2", PHP_BZ2) &&
			CHECK_HEADER_ADD_INCLUDE("bzlib.h", "CFLAGS_BZ2")) {
		EXTENSION("bz2", "bz2.c bz2_filter.c");
		AC_DEFINE('HAVE_BZ2', 1, 'Have BZ2 library');
		// BZ2 extension does this slightly differently from others
		if (PHP_BZ2_SHARED) {
			ADD_FLAG("CFLAGS_BZ2", "/D PHP_BZ2_EXPORTS ");
		}
	} else {
		WARNING("bz2 not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\calendar\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("calendar", "calendar conversion support", "yes"); */

if (PHP_CALENDAR == "yes") {
	EXTENSION("calendar", "calendar.c dow.c french.c gregor.c jewish.c \
		julian.c easter.c cal_unix.c");
	AC_DEFINE('HAVE_CALENDAR', 1, 'Have calendar');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\com_dotnet\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("com-dotnet", "COM and .Net support", "yes"); */

if (PHP_COM_DOTNET == "yes") {
	CHECK_LIB('oleaut32.lib', 'com_dotnet');
	EXTENSION("com_dotnet", "com_com.c com_dotnet.c com_extension.c \
		com_handlers.c com_iterator.c com_misc.c com_olechar.c \
		com_typeinfo.c com_variant.c com_wrapper.c com_saproxy.c com_persist.c",
		null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	AC_DEFINE('HAVE_COM_DOTNET', 1, 'Have COM_DOTNET support');
	CHECK_HEADER_ADD_INCLUDE('mscoree.h', 'CFLAGS_COM_DOTNET');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\ctype\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("ctype", "ctype", "yes"); */

if (PHP_CTYPE == "yes") {
	EXTENSION("ctype", "ctype.c");
	AC_DEFINE('HAVE_CTYPE', 1, 'Have ctype');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\curl\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("curl", "cURL support", "no"); */

if (PHP_CURL != "no") {
	var ver_num = NaN;
	var f = PHP_PHP_BUILD + "/include/curl/curlver.h";
	if (FSO.FileExists(f)) {
		var reg = /LIBCURL_VERSION_NUM\s+(0x[a-z0-9]+)/gi;
		var m = reg.exec(file_get_contents(PHP_PHP_BUILD + "/include/curl/curlver.h"));
		if (!!m && m.length >= 2) {
			ver_num = parseInt(m[1]);
		}
	}

	if (CHECK_LIB("libcurl_a.lib;libcurl.lib", "curl", PHP_CURL) &&
		CHECK_HEADER_ADD_INCLUDE("curl/easy.h", "CFLAGS_CURL") &&
		SETUP_OPENSSL("curl", PHP_CURL) > 0 &&
		CHECK_LIB("winmm.lib", "curl", PHP_CURL) &&
		CHECK_LIB("wldap32.lib", "curl", PHP_CURL) &&
		(((PHP_ZLIB=="no") && (CHECK_LIB("zlib_a.lib;zlib.lib", "curl", PHP_CURL))) ||
			(PHP_ZLIB_SHARED && CHECK_LIB("zlib.lib", "curl", PHP_CURL)) || (PHP_ZLIB == "yes" && (!PHP_ZLIB_SHARED))) &&
		!isNaN(ver_num) &&
		(ver_num <= parseInt("0x073b00") || ver_num > parseInt("0x073b00") &&
			CHECK_LIB("normaliz.lib", "curl", PHP_CURL) &&
			CHECK_LIB("libssh2.lib", "curl", PHP_CURL) &&
			CHECK_LIB("nghttp2.lib", "curl", PHP_CURL))
		) {
		EXTENSION("curl", "interface.c multi.c share.c curl_file.c");
		AC_DEFINE('HAVE_CURL', 1, 'Have cURL library');
		ADD_FLAG("CFLAGS_CURL", "/D CURL_STATICLIB /D PHP_CURL_EXPORTS=1");
		PHP_INSTALL_HEADERS("ext/curl", "php_curl.h");
		// TODO: check for curl_version_info
	} else {
		WARNING("curl not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\date\\config.w32'));
// vim:ft=javascript

EXTENSION("date", "php_date.c", false, "/Iext/date/lib /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1 /DHAVE_TIMELIB_CONFIG_H=1");
PHP_DATE = "yes";
ADD_SOURCES("ext/date/lib", "astro.c timelib.c dow.c parse_date.c parse_posix.c parse_tz.c tm2unixtime.c unixtime2tm.c parse_iso_intervals.c interval.c", "date");

ADD_FLAG('CFLAGS_DATE', "/wd4244");

var tl_config = FSO.CreateTextFile("ext/date/lib/timelib_config.h", true);
tl_config.WriteLine("#include \"config.w32.h\"");
tl_config.WriteLine("#include <php_stdint.h>");
tl_config.WriteLine("#include \"zend.h\"");
tl_config.WriteLine("#define timelib_malloc  emalloc");
tl_config.WriteLine("#define timelib_realloc erealloc");
tl_config.WriteLine("#define timelib_calloc  ecalloc");
tl_config.WriteLine("#define timelib_strdup  estrdup");
tl_config.WriteLine("#define timelib_strndup estrndup");
tl_config.WriteLine("#define timelib_free    efree");
tl_config.Close();

PHP_INSTALL_HEADERS("ext/date/", "php_date.h lib/timelib.h lib/timelib_config.h");
AC_DEFINE('HAVE_TIMELIB_CONFIG_H', 1, 'Have timelib_config.h')
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\dba\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("dba", "DBA support", "no"); */
/* ARG_WITH("qdbm", "DBA: QDBM support", "no"); */
/* ARG_WITH("db", "DBA: Berkeley DB support", "no"); */
/* ARG_WITH("lmdb", "DBA: Lightning memory-mapped database support", "no"); */

if (PHP_DBA != "no") {
	EXTENSION("dba", "dba.c dba_cdb.c dba_db1.c dba_db2.c dba_db3.c dba_dbm.c dba_flatfile.c dba_gdbm.c dba_ndbm.c dba_inifile.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	ADD_SOURCES("ext/dba/libcdb", "cdb.c cdb_make.c uint32.c", "dba");
	ADD_SOURCES("ext/dba/libflatfile", "flatfile.c", "dba");
	ADD_SOURCES("ext/dba/libinifile", "inifile.c", "dba");
	AC_DEFINE('HAVE_DBA', 1, 'DBA support');
	ADD_FLAG("CFLAGS_DBA", "/D DBA_FLATFILE=1 /D DBA_CDB=1 /D DBA_CDB_MAKE=1 /D DBA_CDB_BUILTIN=1 /D DBA_INIFILE=1");

	if (PHP_DB != "no") {
		if (CHECK_LIB("libdb31s.lib;libdb61.lib", "dba", PHP_DBA) &&
			CHECK_HEADER_ADD_INCLUDE("db.h", "CFLAGS_DBA")) {
			ADD_FLAG("CFLAGS_DBA", "/D DBA_DB1=0 /D DB1_VERSION=\"\\\"Berkeley DB 1.85 emulation in DB3\\\"\" /D DB1_INCLUDE_FILE=\"\\\"db_185.h\\\"\" /D DBA_DB3=1 /D DB3_INCLUDE_FILE=\"\\\"db.h\\\"\"");
		} else {
			WARNING("dba: db handlers not enabled; libraries and headers not found");
		}
	}

	if (PHP_QDBM != "no") {
		if (CHECK_LIB("qdbm_a.lib;qdbm.lib", "dba", PHP_DBA) &&
			CHECK_HEADER_ADD_INCLUDE("depot.h", "CFLAGS_DBA", PHP_DBA + ";" + PHP_PHP_BUILD + "\\include\\qdbm")) {
			ADD_SOURCES("ext/dba", "dba_qdbm.c", "dba");
			AC_DEFINE("QDBM_INCLUDE_FILE", "<depot.h>", "", false);
			AC_DEFINE("DBA_QDBM", 1, "");
		} else {
			WARNING("dba: qdbm handlers not enabled; libraries and headers not found");
		}
	}

	if (PHP_LMDB != "no") {
		if (CHECK_LIB("liblmdb_a.lib", "dba", PHP_DBA) &&
			CHECK_HEADER_ADD_INCLUDE("lmdb.h", "CFLAGS_DBA") &&
			CHECK_LIB("ntdll.lib", "dba", PHP_DBA)) {
			ADD_SOURCES("ext/dba", "dba_lmdb.c", "dba");
			AC_DEFINE("LMDB_INCLUDE_FILE", "<lmdb.h>", "", false);
			AC_DEFINE("DBA_LMDB", 1, "");
		} else {
			WARNING("dba: lmdb handlers not enabled; libraries and headers not found");
		}
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\dl_test\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("dl-test", "enable dl_test extension", "no"); */

if (PHP_DL_TEST != "no") {
	EXTENSION("dl_test", "dl_test.c", true, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	ADD_FLAG("CFLAGS_DL_TEST", "/D PHP_DL_TEST_EXPORTS ");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\enchant\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("enchant", "Enchant Support", "no"); */

if (PHP_ENCHANT == "yes") {
	if (CHECK_HEADER_ADD_INCLUDE("enchant.h", "CFLAGS_ENCHANT", PHP_ENCHANT+ ";" + PHP_PHP_BUILD + "\\include\\enchant") &&
			CHECK_HEADER_ADD_INCLUDE("glib.h", "CFLAGS_ENCHANT", PHP_ENCHANT+ ";" + PHP_PHP_BUILD + "\\include\\glib-2.0")) {
		if (CHECK_LIB("libenchant2.lib", "enchant", PHP_ENCHANT)) {
			have_enchant = true;
			AC_DEFINE('HAVE_ENCHANT_BROKER_SET_PARAM', 0);
		} else if (CHECK_LIB("libenchant.lib", "enchant", PHP_ENCHANT)) {
			have_enchant = true;
			AC_DEFINE('HAVE_ENCHANT_BROKER_SET_PARAM', 1);
		} else {
			have_enchant = false;
			WARNING('Could not find libenchant.lib; skipping');
		}
		if (have_enchant) {
			EXTENSION("enchant", "enchant.c");
			AC_DEFINE('HAVE_ENCHANT', 1, 'Have Enchant support', false);
			AC_DEFINE('HAVE_ENCHANT_GET_VERSION', 1);
			ADD_FLAG("CFLAG_ENCHANT", "/D _WIN32");
		}
	} else {
		WARNING('Could not find enchant.h; skipping');
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\ffi\\config.w32'));
/* ARG_WITH('ffi', 'ffi support', 'no'); */

if (PHP_FFI != 'no') {
	if (CHECK_HEADER_ADD_INCLUDE("ffi.h", "CFLAGS_FFI", PHP_FFI+ ";" + PHP_PHP_BUILD + "\\include") &&
		CHECK_LIB("libffi.lib", "ffi", PHP_FFI)) {
		AC_DEFINE('HAVE_FFI', 1, 'ffi support enabled');

		if (!X64) {
		    AC_DEFINE('HAVE_FFI_FASTCALL', 1 ,'libffi supports fastcall calling convention');
		    AC_DEFINE('HAVE_FFI_THISCALL', 1 ,'libffi supports thiscall calling convention');
		    AC_DEFINE('HAVE_FFI_STDCALL', 1 ,'libffi supports stdcall calling convention');
		    AC_DEFINE('HAVE_FFI_MS_CDECL', 1 ,'libffi supports ms_cdecl calling convention');
		    AC_DEFINE('HAVE_FFI_SYSV', 1 ,'libffi supports sysv calling convention');
		}
		if (GREP_HEADER("ffitarget.h", "FFI_VECTORCALL_PARTIAL", PHP_PHP_BUILD + "\\include")) {
			AC_DEFINE('HAVE_FFI_VECTORCALL_PARTIAL', 1 ,'libffi partially supports vectorcall calling convention');
		}

		EXTENSION('ffi', 'ffi.c ffi_parser.c', null, '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	} else {
		WARNING('ffi not enabled, headers or libraries not found');
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\fileinfo\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("fileinfo", "fileinfo support", "no"); */

if (PHP_FILEINFO != 'no') {
	LIBMAGIC_SOURCES=" apprentice.c apptype.c ascmagic.c \
			cdf.c cdf_time.c compress.c \
			encoding.c fsmagic.c funcs.c \
			is_json.c is_tar.c magic.c print.c \
			readcdf.c softmagic.c der.c \
			strcasestr.c buffer.c is_csv.c";

	EXTENSION('fileinfo', 'fileinfo.c', true, "/I" + configure_module_dirname + "/libmagic /I" + configure_module_dirname);
	ADD_SOURCES(configure_module_dirname + '\\libmagic', LIBMAGIC_SOURCES, "fileinfo");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\filter\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("filter", "Filter Support", "yes"); */

if (PHP_FILTER == "yes") {
	EXTENSION("filter", "filter.c sanitizing_filters.c logical_filters.c callback_filter.c", PHP_FILTER_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	PHP_INSTALL_HEADERS("ext/filter", "php_filter.h");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\ftp\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("ftp", "ftp support", "no"); */

if (PHP_FTP != "no") {

	EXTENSION("ftp", "php_ftp.c ftp.c");

	var ret = SETUP_OPENSSL("ftp", PHP_FTP);

	if (ret > 0) {
		MESSAGE("Enabling SSL support for ext\\ftp");
		AC_DEFINE('HAVE_FTP_SSL', 1, 'Have FTP over SSL support');
	}

	AC_DEFINE('HAVE_FTP', 1, 'Have FTP support');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\gd\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("gd", "Bundled GD support", "yes,shared"); */
/* ARG_WITH("libwebp", "webp support", "yes"); */
/* ARG_WITH("libavif", "avif support", "yes"); */

if (PHP_GD != "no") {
	if (
		CHECK_LIB("libjpeg_a.lib;libjpeg.lib", "gd", PHP_GD) &&
		CHECK_LIB("freetype_a.lib;freetype.lib", "gd", PHP_GD) &&
		CHECK_HEADER_ADD_INCLUDE("ft2build.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\freetype2;" + PHP_PHP_BUILD + "\\include\\freetype") &&
		CHECK_LIB("libpng_a.lib;libpng.lib", "gd", PHP_GD) &&
		CHECK_HEADER_ADD_INCLUDE("gd.h", "CFLAGS_GD", PHP_GD + ";ext\\gd\\libgd") &&
		(CHECK_HEADER_ADD_INCLUDE("png.h", "CFLAGS_GD", PHP_GD +  ";" + PHP_PHP_BUILD + "\\include\\libpng16") ||
		CHECK_HEADER_ADD_INCLUDE("png.h", "CFLAGS_GD", PHP_GD +  ";" + PHP_PHP_BUILD + "\\include\\libpng15") ||
		CHECK_HEADER_ADD_INCLUDE("png.h", "CFLAGS_GD", PHP_GD +  ";" + PHP_PHP_BUILD + "\\include\\libpng12")) &&
		(CHECK_LIB("libiconv_a.lib;libiconv.lib", "gd", PHP_GD) || CHECK_LIB("iconv_a.lib;iconv.lib", "gd", PHP_GD)) &&
		 CHECK_HEADER_ADD_INCLUDE("iconv.h", "CFLAGS_GD", PHP_GD) &&
		(((PHP_ZLIB=="no") && (CHECK_LIB("zlib_a.lib;zlib.lib", "gd", PHP_GD) )) ||
			(PHP_ZLIB_SHARED && CHECK_LIB("zlib.lib", "gd", PHP_GD)) || (PHP_ZLIB == "yes" && (!PHP_ZLIB_SHARED))) &&
		CHECK_LIB("libXpm_a.lib", "gd", PHP_GD) &&
		CHECK_HEADER_ADD_INCLUDE("xpm.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\X11")
		) {

		if (PHP_LIBWEBP != "no") {
			if ((CHECK_LIB("libwebp_a.lib", "gd", PHP_GD) || CHECK_LIB("libwebp.lib", "gd", PHP_GD)) &&
				CHECK_HEADER_ADD_INCLUDE("decode.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\webp") &&
				CHECK_HEADER_ADD_INCLUDE("encode.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\webp")) {
				AC_DEFINE("HAVE_LIBWEBP", 1, "WebP support");
				AC_DEFINE("HAVE_GD_WEBP", 1, "WebP support");
			} else {
				WARNING("libwebp not enabled; libraries and headers not found");
			}
		}
		if (PHP_LIBAVIF != "no") {
			if (CHECK_LIB("avif_a.lib", "gd", PHP_GD) &&
				CHECK_LIB("aom_a.lib", "gd", PHP_GD) &&
				CHECK_HEADER_ADD_INCLUDE("avif.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\avif")) {
				ADD_FLAG("CFLAGS_GD", "/D HAVE_LIBAVIF /D HAVE_GD_AVIF");
			} else if (CHECK_LIB("avif.lib", "gd", PHP_GD) &&
				CHECK_HEADER_ADD_INCLUDE("avif.h", "CFLAGS_GD", PHP_GD + ";" + PHP_PHP_BUILD + "\\include\\avif")) {
				ADD_FLAG("CFLAGS_GD", "/D HAVE_LIBAVIF /D HAVE_GD_AVIF");
			} else {
				WARNING("libavif not enabled; libraries and headers not found");
			}
		}
		CHECK_LIB("User32.lib", "gd", PHP_GD);
		CHECK_LIB("Gdi32.lib", "gd", PHP_GD);

		EXTENSION("gd", "gd.c", null, "-Iext/gd/libgd");
		ADD_SOURCES("ext/gd/libgd", "gd2copypal.c gd.c \
			gdcache.c gdfontg.c gdfontl.c gdfontmb.c gdfonts.c gdfontt.c \
			gdft.c gd_gd2.c gd_gd.c gd_gif_in.c gd_gif_out.c gdhelpers.c gd_io.c gd_io_dp.c \
			gd_io_file.c gd_io_ss.c gd_jpeg.c gdkanji.c gd_png.c gd_ss.c \
			gdtables.c gd_topal.c gd_wbmp.c gdxpm.c wbmp.c gd_xbm.c gd_security.c gd_transform.c \
			gd_filter.c gd_pixelate.c gd_rotate.c gd_color_match.c gd_webp.c gd_avif.c \
			gd_crop.c gd_interpolation.c gd_matrix.c gd_bmp.c gd_tga.c", "gd");
		AC_DEFINE('HAVE_LIBGD', 1, 'GD support');
		AC_DEFINE('HAVE_GD_BUNDLED', 1, "Bundled GD");
		AC_DEFINE('HAVE_GD_PNG', 1, "PNG support");
		AC_DEFINE('HAVE_GD_BMP', 1, "BMP support");
		AC_DEFINE('HAVE_GD_TGA', 1, "TGA support");
		AC_DEFINE('HAVE_LIBPNG', 1, "PNG support");
		AC_DEFINE('HAVE_LIBJPEG', 1, "JPEG support");
		AC_DEFINE('HAVE_GD_JPG', 1, "JPEG support");
		AC_DEFINE('HAVE_XPM', 1, "XPM support");
		AC_DEFINE('HAVE_GD_XPM', 1, "XPM support");
		AC_DEFINE('HAVE_LIBFREETYPE', 1, "Freetype support");
		AC_DEFINE('HAVE_GD_FREETYPE', 1, "Freetype support");
		ADD_FLAG("CFLAGS_GD", " \
/D PHP_GD_EXPORTS=1 \
/D HAVE_GD_DYNAMIC_CTX_EX=1 \
/D HAVE_GD_GD2  \
/D HAVE_GD_GIF_READ=1  \
/D HAVE_GD_GIF_CREATE=1  \
/D HAVE_GDIMAGECOLORRESOLVE=1  \
/D HAVE_GD_IMAGESETBRUSH=1  \
/D HAVE_GD_IMAGESETTILE=1 \
/D HAVE_GD_FONTCACHESHUTDOWN=1 \
/D HAVE_GD_FONTMUTEX=1 \
/D HAVE_GD_STRINGFTEX=1  \
/D HAVE_GD_STRINGTTF=1  \
/D HAVE_GD_WBMP  \
/D HAVE_GD_XBM  \
/D HAVE_LIBGD13=1  \
/D HAVE_LIBGD15=1  \
/D HAVE_LIBGD20=1  \
/D HAVE_LIBGD204=1 \
/D HAVE_COLORCLOSESTHWB  \
/D HAVE_GD_GET_INTERPOLATION \
/D USE_GD_IOCTX \
/D MSWIN32 \
		");
		if (ICC_TOOLSET) {
			ADD_FLAG("LDFLAGS_GD", "/nodefaultlib:libcmt");
		}

		PHP_INSTALL_HEADERS("", "ext/gd ext/gd/libgd" );
	} else {
		WARNING("gd not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\gettext\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("gettext", "gettext support", "no"); */

if (PHP_GETTEXT != "no") {
	if (CHECK_LIB("libintl_a.lib;libintl.lib", "gettext", PHP_GETTEXT) && CHECK_HEADER_ADD_INCLUDE("libintl.h", "CFLAGS_GETTEXT")) {
		EXTENSION("gettext", "gettext.c", PHP_GETTEXT_SHARED, "-DHAVE_BIND_TEXTDOMAIN_CODESET=1 -DHAVE_DNGETTEXT=1 -DHAVE_NGETTEXT=1 -DHAVE_LIBINTL=1 -DHAVE_DCNGETTEXT=1");
	} else {
		WARNING("gettext not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\gmp\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("gmp", "Include GNU MP support.", "no"); */

if (PHP_GMP != "no") {
	if (CHECK_LIB("mpir_a.lib", "gmp", PHP_GMP) &&
		CHECK_HEADER_ADD_INCLUDE("gmp.h", "CFLAGS_GMP", PHP_GMP +  ";" + PHP_PHP_BUILD + "\\include\\mpir")) {
		EXTENSION("gmp", "gmp.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		PHP_INSTALL_HEADERS("ext/gmp", "php_gmp_int.h");
		AC_DEFINE('HAVE_GMP', 1, 'GMP support');
	} else {
		WARNING("GMP not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\hash\\config.w32'));
// vim:ft=javascript

/* ARG_WITH('mhash', 'mhash support (BC via hash)', 'no'); */

if (PHP_MHASH != 'no') {
	AC_DEFINE('PHP_MHASH_BC', 1);
}

PHP_HASH = 'yes';

EXTENSION('hash',	'hash.c hash_md.c hash_sha.c hash_ripemd.c hash_haval.c ' +
					'hash_tiger.c hash_gost.c hash_snefru.c hash_whirlpool.c ' +
					'hash_adler32.c hash_crc32.c hash_joaat.c hash_fnv.c ' +
					'hash_sha3.c hash_murmur.c hash_xxhash.c', false);

var hash_sha3_dir = 'ext/hash/sha3/generic' + (X64 ? '64' : '32') + 'lc';

if(X64) {
	ADD_SOURCES(hash_sha3_dir, 'KeccakHash.c KeccakSponge.c KeccakP-1600-opt64.c', 'hash');
} else {
	ADD_SOURCES(hash_sha3_dir, 'KeccakHash.c KeccakSponge.c KeccakP-1600-inplace32BI.c', 'hash');
}

if (!CHECK_HEADER_ADD_INCLUDE('KeccakHash.h', 'CFLAGS_HASH', hash_sha3_dir)) {
	// Should NEVER happen
	ERROR('Unable to locate SHA3 headers');
}

ADD_FLAG('CFLAGS_HASH', '/DKeccakP200_excluded /DKeccakP400_excluded /DKeccakP800_excluded /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');

var hash_murmur_dir = 'ext/hash/murmur';
if (!CHECK_HEADER_ADD_INCLUDE('PMurHash.h', 'CFLAGS_HASH', hash_murmur_dir)) {
	ERROR('Unable to locate murmur headers');
}
ADD_SOURCES(hash_murmur_dir, 'PMurHash.c PMurHash128.c', 'hash');

var hash_xxhash_dir = 'ext/hash/xxhash';
if (!CHECK_HEADER_ADD_INCLUDE('xxhash.h', 'CFLAGS_HASH', hash_xxhash_dir)) {
	ERROR('Unable to locate xxhash headers');
}

PHP_INSTALL_HEADERS('ext/hash/',	'php_hash.h php_hash_md.h php_hash_sha.h ' +
									'php_hash_ripemd.h php_hash_haval.h php_hash_tiger.h ' +
									'php_hash_gost.h php_hash_snefru.h php_hash_whirlpool.h ' +
									'php_hash_adler32.h php_hash_crc32.h php_hash_sha3.h ' +
									'php_hash_murmur.h php_hash_xxhash.h');
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\iconv\\config.w32'));
// vim: ft=javascript

/* ARG_WITH("iconv", "iconv support", "yes"); */

if (PHP_ICONV != "no") {
	if ((CHECK_LIB("libiconv_a.lib", "iconv", PHP_ICONV) || CHECK_LIB("libiconv.lib", "iconv", PHP_ICONV) ||
			CHECK_LIB("iconv_a.lib", "iconv", PHP_ICONV) || CHECK_LIB("iconv.lib", "iconv", PHP_ICONV)) &&
		CHECK_HEADER_ADD_INCLUDE("iconv.h", "CFLAGS_ICONV", PHP_ICONV)) {

		EXTENSION("iconv", "iconv.c", PHP_ICONV_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

		AC_DEFINE("HAVE_ICONV", 1, "Define if iconv extension is enabled");
		AC_DEFINE("HAVE_LIBICONV", 1, "Define if libiconv is available");
		AC_DEFINE("ICONV_ALIASED_LIBICONV", 1, "The iconv function is called iconv() in libiconv");
		AC_DEFINE("PHP_ICONV_IMPL", "\"libiconv\"", "Which iconv implementation to use");
		ADD_FLAG("CFLAGS_ICONV", "/D PHP_ICONV_EXPORTS ");
		if (!PHP_ICONV_SHARED) {
			ADD_DEF_FILE("ext\\iconv\\php_iconv.def");
		}
		PHP_INSTALL_HEADERS("", "ext/iconv");
	} else {
		WARNING("iconv support can't be enabled, libraries or headers are missing")
		PHP_ICONV = "no";
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\imap\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("imap", "IMAP Support", "no"); */

if (PHP_IMAP == "yes") {
	if (CHECK_LIB("cclient_a.lib;cclient.lib", "imap") &&
			(CHECK_HEADER_ADD_INCLUDE("c-client.h", "CFLAGS_IMAP")||
			CHECK_HEADER_ADD_INCLUDE("c-client/c-client.h", "CFLAGS_IMAP", null, null, true)) ||
			(CHECK_HEADER_ADD_INCLUDE("utf8aux.h", "CFLAGS_IMAP")||
			CHECK_HEADER_ADD_INCLUDE("c-client/utf8aux.h", "CFLAGS_IMAP", null, null, true))
			) {
		CHECK_LIB("winmm.lib", "imap");
		CHECK_LIB("ws2_32.lib", "imap");
		CHECK_LIB("Secur32.lib", "imap");
		CHECK_LIB("crypt32.lib", "imap");
		EXTENSION("imap", "php_imap.c", true, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

		ADD_FLAG("CFLAGS_IMAP", "/D HAVE_IMAP2000=1 /D HAVE_IMAP2004=1 /D HAVE_IMAP2007a=1 /D HAVE_IMAP2007b=1 /D HAVE_IMAP_SSL=1");
		AC_DEFINE('HAVE_IMAP', 1, 'Have IMAP support', true);
		AC_DEFINE('HAVE_RFC822_OUTPUT_ADDRESS_LIST', 1, 'Have rfc822_output_address_list', true);
		AC_DEFINE('HAVE_IMAP_MUTF7', 1, 'Have modified utf7 support', true);
		AC_DEFINE('HAVE_NEW_MIME2TEXT', 1, 'Whether utf8_mime2text() has new signature');
	} else {
		WARNING("imap not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\intl\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("intl", "Enable internationalization support", "no"); */

if (PHP_INTL != "no") {
	if (CHECK_LIB("icuuc.lib", "intl", PHP_INTL) &&
					CHECK_HEADER_ADD_INCLUDE("unicode/utf.h", "CFLAGS_INTL")) {
		// always build as shared - zend_strtod.c/ICU type conflict
		EXTENSION("intl", "php_intl.c intl_convert.c intl_convertcpp.cpp intl_error.c ", true,
								"/I \"" + configure_module_dirname + "\" /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		ADD_SOURCES(configure_module_dirname + "/collator", "\
				collator.c \
				collator_attr.c \
				collator_class.c \
				collator_compare.c \
				collator_convert.c \
				collator_create.c \
				collator_error.c \
				collator_is_numeric.c \
				collator_locale.c \
				collator_sort.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/common", "\
				common_error.c \
				common_enum.cpp \
				common_date.cpp \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/converter", "\
				converter.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/formatter", "\
				formatter.c \
				formatter_attr.c \
				formatter_class.c \
				formatter_data.c \
				formatter_format.c \
				formatter_main.c \
				formatter_parse.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/locale", "\
				locale.c \
				locale_class.c \
				locale_methods.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/msgformat", "\
				msgformat.c \
				msgformat_attr.c \
				msgformat_class.c \
				msgformat_data.c \
				msgformat_format.c \
				msgformat_helpers.cpp \
				msgformat_parse.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/grapheme", "\
                                grapheme_string.c grapheme_util.c  \
                                ", "intl");
		ADD_SOURCES(configure_module_dirname + "/normalizer", "\
				normalizer.c \
				normalizer_class.c \
				normalizer_normalize.c \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/dateformat", "\
				dateformat.c \
				dateformat_class.c \
				dateformat_attr.c \
				dateformat_format.c \
				dateformat_format_object.cpp \
				dateformat_parse.c \
				dateformat_data.c \
				dateformat_attrcpp.cpp \
				dateformat_helpers.cpp \
				dateformat_create.cpp \
				datepatterngenerator_class.cpp \
				datepatterngenerator_methods.cpp \
				", "intl");
		ADD_SOURCES(configure_module_dirname + "/uchar", "\
				uchar.c",
				"intl");
		ADD_SOURCES(configure_module_dirname + "/idn", "\
				idn.c",
				"intl");
		ADD_SOURCES(configure_module_dirname + "/resourcebundle", "\
				resourcebundle.c \
				resourcebundle_class.c \
				resourcebundle_iterator.c",
				"intl");

		if (CHECK_HEADER_ADD_INCLUDE("unicode/uspoof.h", "CFLAGS_INTL")) {
			ADD_SOURCES(configure_module_dirname + "/spoofchecker", "\
					spoofchecker.c \
					spoofchecker_class.c \
					spoofchecker_create.c \
					spoofchecker_main.c",
					"intl");
		}

		ADD_SOURCES(configure_module_dirname + "/transliterator", "\
				transliterator.c \
				transliterator_class.c \
				transliterator_methods.c",
				"intl");

		ADD_SOURCES(configure_module_dirname + "/timezone", "\
				timezone_class.cpp \
				timezone_methods.cpp",
				"intl");

		ADD_SOURCES(configure_module_dirname + "/calendar", "\
				calendar_methods.cpp \
				gregoriancalendar_methods.cpp \
				calendar_class.cpp",
				"intl");

		ADD_SOURCES(configure_module_dirname + "/breakiterator", "\
				breakiterator_class.cpp \
				breakiterator_methods.cpp \
				breakiterator_iterators.cpp \
				rulebasedbreakiterator_methods.cpp \
				codepointiterator_internal.cpp \
				codepointiterator_methods.cpp ",
				"intl");

		ADD_FLAG("LIBS_INTL", "icudt.lib icuin.lib icuio.lib");

		/* Compat for ICU before 58.1.*/
		if (CHECK_LIB("icule.lib", "intl", PHP_INTL)) {
			ADD_FLAG("LIBS_INTL", "icule.lib");
		}
		if (CHECK_LIB("iculx.lib", "intl", PHP_INTL)) {
			ADD_FLAG("LIBS_INTL", "iculx.lib");
		}

		ADD_FLAG("CFLAGS_INTL", "/EHsc /DUNISTR_FROM_CHAR_EXPLICIT=explicit /DUNISTR_FROM_STRING_EXPLICIT=explicit /DU_NO_DEFAULT_INCLUDE_UTF_HEADERS=1 /DU_HIDE_OBSOLETE_UTF_OLD_H=1");
		AC_DEFINE("HAVE_INTL", 1, "Internationalization support enabled");
	} else {
		WARNING("intl not enabled; libraries and/or headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\json\\config.w32'));
// vim:ft=javascript

EXTENSION('json', 'json.c', false /* never shared */, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
PHP_JSON="yes";
ADD_SOURCES(configure_module_dirname, "json_encoder.c json_parser.tab.c json_scanner.c", "json");

ADD_MAKEFILE_FRAGMENT();

PHP_INSTALL_HEADERS("ext/json/", "php_json.h php_json_parser.h php_json_scanner.h");
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\ldap\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("ldap", "LDAP support", "no"); */

if (PHP_LDAP != "no") {

	if (CHECK_HEADER_ADD_INCLUDE("ldap.h", "CFLAGS_LDAP", PHP_PHP_BUILD + "\\include\\openldap;" + PHP_PHP_BUILD + "\\openldap\\include;" + PHP_LDAP) &&
			CHECK_HEADER_ADD_INCLUDE("lber.h", "CFLAGS_LDAP", PHP_PHP_BUILD + "\\include\\openldap;" + PHP_PHP_BUILD + "\\openldap\\include;" + PHP_LDAP) &&
			SETUP_OPENSSL("ldap", PHP_LDAP) > 0 &&
			CHECK_LIB("oldap32_a.lib", "ldap", PHP_LDAP) &&
			CHECK_LIB("olber32_a.lib", "ldap", PHP_LDAP)&&
			CHECK_LIB("libsasl.lib", "ldap", PHP_LDAP)) {
		EXTENSION('ldap', 'ldap.c', null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

		AC_DEFINE('HAVE_LDAP_PARSE_RESULT', 1);
		AC_DEFINE('HAVE_LDAP_PARSE_REFERENCE', 1);
		AC_DEFINE('HAVE_LDAP_START_TLS_S', 1);
		AC_DEFINE('HAVE_LDAP', 1);
		AC_DEFINE('HAVE_LDAP_SASL', 1);
		AC_DEFINE('HAVE_LDAP_CONTROL_FIND', 1);
		AC_DEFINE('HAVE_LDAP_PARSE_EXTENDED_RESULT', 1);
		AC_DEFINE('HAVE_LDAP_EXTENDED_OPERATION_S', 1);
		AC_DEFINE('HAVE_LDAP_PASSWD', 1);
		AC_DEFINE('HAVE_LDAP_WHOAMI_S', 1);
		AC_DEFINE('HAVE_LDAP_REFRESH_S', 1);
		AC_DEFINE('HAVE_LDAP_EXTENDED_OPERATION', 1);

	} else {
		WARNING("ldap not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\mbstring\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("mbstring", "multibyte string functions", "no"); */
/* ARG_ENABLE("mbregex", "multibyte regex support", "no"); */

if (PHP_MBSTRING != "no") {

	if (CHECK_HEADER_ADD_INCLUDE("mbstring.h", "CFLAGS_MBSTRING", PHP_MBSTRING + ";" + PHP_PHP_BUILD + "\\include")) {
		EXTENSION("mbstring", "mbstring.c php_unicode.c mb_gpc.c", PHP_MBSTRING_SHARED);

		STDOUT.WriteLine("Using bundled libmbfl...");

		ADD_FLAG("CFLAGS_MBSTRING", "-Iext/mbstring -Iext/mbstring/libmbfl -Iext/mbstring/libmbfl/mbfl \
			/D HAVE_STRICMP /D MBFL_DLL_EXPORT=1 /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1")

		FSO.CopyFile("ext\\mbstring\\libmbfl\\config.h.w32",
			"ext\\mbstring\\libmbfl\\config.h", true);

		ADD_SOURCES("ext/mbstring/libmbfl/filters", "html_entities.c \
			mbfilter_7bit.c mbfilter_base64.c mbfilter_big5.c mbfilter_cp932.c \
			mbfilter_cp936.c mbfilter_cp51932.c mbfilter_euc_cn.c \
			mbfilter_euc_jp.c mbfilter_euc_jp_win.c mbfilter_euc_kr.c \
			mbfilter_euc_tw.c mbfilter_htmlent.c mbfilter_hz.c mbfilter_iso2022_kr.c \
			mbfilter_jis.c mbfilter_iso2022_jp_ms.c mbfilter_gb18030.c \
			mbfilter_sjis_2004.c mbfilter_qprint.c mbfilter_sjis.c mbfilter_ucs2.c \
			mbfilter_ucs4.c mbfilter_uhc.c mbfilter_utf16.c mbfilter_utf32.c \
			mbfilter_utf7.c mbfilter_utf7imap.c mbfilter_utf8.c \
			mbfilter_utf8_mobile.c mbfilter_euc_jp_2004.c mbfilter_uuencode.c \
			mbfilter_cp5022x.c mbfilter_sjis_mobile.c \
			mbfilter_sjis_mac.c mbfilter_iso2022jp_2004.c \
			mbfilter_iso2022jp_mobile.c mbfilter_singlebyte.c \
			mbfilter_tl_jisx0201_jisx0208.c", "mbstring");

		ADD_SOURCES("ext/mbstring/libmbfl/mbfl", "mbfilter.c mbfilter_8bit.c \
			mbfilter_pass.c mbfilter_wchar.c mbfl_convert.c mbfl_encoding.c \
			mbfl_filter_output.c mbfl_language.c mbfl_memory_device.c \
			mbfl_string.c", "mbstring");

		ADD_SOURCES("ext/mbstring/libmbfl/nls", "nls_de.c nls_en.c nls_ja.c \
			nls_kr.c nls_neutral.c nls_ru.c nls_uni.c nls_zh.c nls_hy.c \
			nls_ua.c nls_tr.c", "mbstring");

		PHP_INSTALL_HEADERS("ext/mbstring", "mbstring.h libmbfl/config.h libmbfl/mbfl/eaw_table.h libmbfl/mbfl/mbfilter.h libmbfl/mbfl/mbfilter_8bit.h libmbfl/mbfl/mbfilter_pass.h libmbfl/mbfl/mbfilter_wchar.h libmbfl/mbfl/mbfl_consts.h libmbfl/mbfl/mbfl_convert.h libmbfl/mbfl/mbfl_defs.h libmbfl/mbfl/mbfl_encoding.h libmbfl/mbfl/mbfl_filter_output.h libmbfl/mbfl/mbfl_language.h libmbfl/mbfl/mbfl_memory_device.h libmbfl/mbfl/mbfl_string.h");

		AC_DEFINE('HAVE_MBSTRING', 1, 'Have mbstring support');

		if (PHP_MBREGEX != "no") {
			if (CHECK_HEADER_ADD_INCLUDE("oniguruma.h", "CFLAGS_MBSTRING", PHP_MBREGEX) &&
				CHECK_LIB("onig_a.lib;libonig_a.lib", "mbstring", PHP_MBSTRING)) {
				AC_DEFINE('HAVE_MBREGEX', 1);

				/* XXX libonig is only usable as a static library ATM, code change required to link with a DLL. */
				ADD_FLAG("CFLAGS_MBSTRING", "/DONIG_EXTERN=extern /DPHP_ONIG_BAD_KOI8_ENTRY=1 /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

				ADD_SOURCES("ext/mbstring", "php_mbregex.c", "mbstring");
				PHP_INSTALL_HEADERS("ext/mbstring", "php_mbregex.h php_onig_compat.h");
			} else {
				WARNING("mbregex not enabled; libraries and headers not found");
			}
		}

	} else {
		WARNING("mbstring not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\mysqlnd\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("mysqlnd", "Mysql Native Client Driver", "yes"); */
if (PHP_MYSQLND != "no") {

	if (CHECK_LIB("ws2_32.lib", "mysqlnd")) {
		mysqlnd_source =
			"mysqlnd_alloc.c " +
			"mysqlnd_auth.c " +
			"mysqlnd_block_alloc.c " +
			"mysqlnd_connection.c " +
			"mysqlnd_charset.c " +
			"mysqlnd_commands.c " +
			"mysqlnd_debug.c " +
			"mysqlnd_driver.c " +
			"mysqlnd_ext_plugin.c " +
			"mysqlnd_loaddata.c " +
			"mysqlnd_reverse_api.c " +
			"mysqlnd_plugin.c " +
			"mysqlnd_protocol_frame_codec.c " +
			"mysqlnd_ps.c " +
			"mysqlnd_ps_codec.c " +
			"mysqlnd_read_buffer.c " +
			"mysqlnd_result.c " +
			"mysqlnd_result_meta.c " +
			"mysqlnd_statistics.c " +
			"mysqlnd_vio.c " +
			"mysqlnd_wireprotocol.c " +
			"php_mysqlnd.c ";
		EXTENSION("mysqlnd", mysqlnd_source, false, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		if ((((PHP_ZLIB=="no") && (CHECK_LIB("zlib_a.lib;zlib.lib", "mysqlnd", PHP_MYSQLND))) ||
			(PHP_ZLIB_SHARED && CHECK_LIB("zlib.lib", "mysqlnd", PHP_MYSQLND)) ||
			(PHP_ZLIB == "yes" && (!PHP_ZLIB_SHARED))) &&
			CHECK_HEADER_ADD_INCLUDE("zlib.h", "CFLAGS", "..\\zlib;" + php_usual_include_suspects)
			)
		{
			AC_DEFINE("MYSQLND_COMPRESSION_ENABLED", 1, "Compression support");
			AC_DEFINE("MYSQLND_SSL_SUPPORTED", 1, "SSL support");
			if (CHECK_LIB("crypt32.lib", "mysqlnd")) {
				AC_DEFINE("MYSQLND_HAVE_SSL", 1, "Extended SSL support");
			}
		}
		PHP_INSTALL_HEADERS("", "ext/mysqlnd");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\oci8\\config.w32'));
// vim:ft=javascript

if (PHP_OCI8 != "no" && PHP_OCI8_11G != "no") {
	if (!PHP_OCI8_SHARED && !PHP_OCI8_11G_SHARED) {
		WARNING("oci8 and oci8-11g provide the same extension and cannot both be built statically");
		PHP_OCI8 = "no"
	}
}

if (PHP_OCI8 != "no" && PHP_OCI8_12C != "no") {
	if (!PHP_OCI8_SHARED && !PHP_OCI8_12C_SHARED) {
		WARNING("oci8 and oci8-12c provide the same extension and cannot both be built statically");
		PHP_OCI8 = "no"
	}
}

if (PHP_OCI8_11G != "no" && PHP_OCI8_12C != "no") {
	if (!PHP_OCI8_11G_SHARED && !PHP_OCI8_12C_SHARED) {
		WARNING("oci8-11g and oci8-12c provide the same extension and cannot both be built statically");
		PHP_OCI8_11G = "no"
	}
}

if (PHP_OCI8 != "no" && PHP_OCI8_19 != "no") {
	if (!PHP_OCI8_SHARED && !PHP_OCI8_19_SHARED) {
		WARNING("oci8 and oci8-19 provide the same extension and cannot both be built statically");
		PHP_OCI8 = "no"
	}
}

if (PHP_OCI8_11G != "no" && PHP_OCI8_19 != "no") {
	if (!PHP_OCI8_11G_SHARED && !PHP_OCI8_19_SHARED) {
		WARNING("oci8-11g and oci8-19 provide the same extension and cannot both be built statically");
		PHP_OCI8_11G = "no"
	}
}

if (PHP_OCI8_12C != "no" && PHP_OCI8_19 != "no") {
	if (!PHP_OCI8_12C_SHARED && !PHP_OCI8_19_SHARED) {
		WARNING("oci8-12c and oci8-19 provide the same extension and cannot both be built statically");
		PHP_OCI8_12C = "no"
	}
}

/* ARG_WITH("oci8", "OCI8 support", "no"); */

if (PHP_OCI8 != "no") {

	oci8_dirs = new Array(
		PHP_OCI8
	);

	oci8_lib_paths = "";
	oci8_inc_paths = "";

	// find the Oracle install
	for (i = 0; i < oci8_dirs.length; i++) {
		oci8_lib_paths += oci8_dirs[i] + "\\lib;";
		oci8_lib_paths += oci8_dirs[i] + "\\lib\\msvc;";
		oci8_inc_paths += oci8_dirs[i] + "\\include;";
	}

	oci8_inc_paths += PHP_PHP_BUILD + "\\include\\instantclient;"
	oci8_lib_paths += PHP_PHP_BUILD + "\\lib\\instantclient;";

	if (CHECK_HEADER_ADD_INCLUDE("oci.h", "CFLAGS_OCI8", oci8_inc_paths) &&
			CHECK_LIB("oci.lib", "oci8", oci8_lib_paths))
	{
		EXTENSION('oci8', 'oci8.c oci8_lob.c oci8_statement.c oci8_collection.c oci8_interface.c oci8_failover.c');

		AC_DEFINE('HAVE_OCI8', 1);
		AC_DEFINE('HAVE_OCI_INSTANT_CLIENT', 1);

	} else {
		WARNING("oci8 not enabled: Oracle Database client libraries or Oracle 10g Instant Client not found");
		PHP_OCI8 = "no"
	}
}

/* ARG_WITH("oci8-11g", "OCI8 support using Oracle 11g Instant Client", "no"); */

if (PHP_OCI8_11G != "no") {

	oci8_11g_dirs = new Array(
		PHP_OCI8_11G
	);

	oci8_11g_lib_paths = "";
	oci8_11g_inc_paths = "";

	// find the Oracle install
	for (i = 0; i < oci8_11g_dirs.length; i++) {
		oci8_11g_lib_paths += oci8_11g_dirs[i] + "\\lib;";
		oci8_11g_lib_paths += oci8_11g_dirs[i] + "\\lib\\msvc;";
		oci8_11g_inc_paths += oci8_11g_dirs[i] + "\\include;";
	}

	oci8_11g_inc_paths += PHP_PHP_BUILD + "\\include\\instantclient_11;"
	oci8_11g_lib_paths += PHP_PHP_BUILD + "\\lib\\instantclient_11;";

	if (CHECK_HEADER_ADD_INCLUDE("oci.h", "CFLAGS_OCI8_11G", oci8_11g_inc_paths) &&
			CHECK_LIB("oci.lib", "oci8_11g", oci8_11g_lib_paths))
	{
		EXTENSION('oci8_11g', 'oci8.c oci8_lob.c oci8_statement.c oci8_collection.c oci8_interface.c oci8_failover.c', null, null, null, "ext\\oci8_11g")

		AC_DEFINE('HAVE_OCI8', 1);
		AC_DEFINE('HAVE_OCI_INSTANT_CLIENT', 1);

	} else {
		WARNING("oci8-11g not enabled: Oracle Database client libraries or Oracle 11g Instant Client not found");
		PHP_OCI8_11G = "no"
	}
}

/* ARG_WITH("oci8-12c", "OCI8 support using Oracle Database 12c Instant Client", "no"); */

if (PHP_OCI8_12C != "no") {

	oci8_12c_dirs = new Array(
		PHP_OCI8_12C
	);

	oci8_12c_lib_paths = "";
	oci8_12c_inc_paths = "";

	// find the Oracle install
	for (i = 0; i < oci8_12c_dirs.length; i++) {
		oci8_12c_lib_paths += oci8_12c_dirs[i] + "\\lib;";
		oci8_12c_lib_paths += oci8_12c_dirs[i] + "\\lib\\msvc;";
		oci8_12c_inc_paths += oci8_12c_dirs[i] + "\\include;";
	}

	oci8_12c_inc_paths += PHP_PHP_BUILD + "\\include\\instantclient_12;"
	oci8_12c_lib_paths += PHP_PHP_BUILD + "\\lib\\instantclient_12;";

	if (CHECK_HEADER_ADD_INCLUDE("oci.h", "CFLAGS_OCI8_12C", oci8_12c_inc_paths) &&
			CHECK_LIB("oci.lib", "oci8_12c", oci8_12c_lib_paths))
	{
		EXTENSION('oci8_12c', 'oci8.c oci8_lob.c oci8_statement.c oci8_collection.c oci8_interface.c oci8_failover.c', null, null, null, "ext\\oci8_12c")

		AC_DEFINE('HAVE_OCI8', 1);
		AC_DEFINE('HAVE_OCI_INSTANT_CLIENT', 1);
	} else {
		WARNING("oci8-12c not enabled: Oracle Database client libraries or Oracle Database 12c Instant Client not found");
		PHP_OCI8_12C = "no"
	}
}

/* ARG_WITH("oci8-19", "OCI8 support using Oracle Database 19 Instant Client", "no"); */

if (PHP_OCI8_19 != "no") {

	oci8_19_dirs = new Array(
		PHP_OCI8_19
	);

	oci8_19_lib_paths = "";
	oci8_19_inc_paths = "";

	// find the Oracle install
	for (i = 0; i < oci8_19_dirs.length; i++) {
		oci8_19_lib_paths += oci8_19_dirs[i] + "\\lib;";
		oci8_19_lib_paths += oci8_19_dirs[i] + "\\lib\\msvc;";
		oci8_19_inc_paths += oci8_19_dirs[i] + "\\include;";
	}

	oci8_19_inc_paths += PHP_PHP_BUILD + "\\include\\instantclient_12;"
	oci8_19_lib_paths += PHP_PHP_BUILD + "\\lib\\instantclient_12;";

	if (CHECK_HEADER_ADD_INCLUDE("oci.h", "CFLAGS_OCI8_19", oci8_19_inc_paths) &&
			CHECK_LIB("oci.lib", "oci8_19", oci8_19_lib_paths))
	{
		EXTENSION('oci8_19', 'oci8.c oci8_lob.c oci8_statement.c oci8_collection.c oci8_interface.c oci8_failover.c', null, null, null, "ext\\oci8_19")

		AC_DEFINE('HAVE_OCI8', 1);
		AC_DEFINE('HAVE_OCI_INSTANT_CLIENT', 1);
	} else {
		WARNING("oci8-19 not enabled: Oracle Database client libraries or Oracle Database 19 Instant Client not found");
		PHP_OCI8_19 = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\odbc\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("odbc", "ODBC support", "no"); */
/* ARG_WITH("odbcver", "Force support for the passed ODBC version. A hex number is expected, default 0x0350. Use the special value of 0 to prevent an explicit ODBCVER to be defined.", "0x0350"); */

if (PHP_ODBC == "yes") {
	if (CHECK_LIB("odbc32.lib", "odbc") && CHECK_LIB("odbccp32.lib", "odbc")
	&& CHECK_HEADER_ADD_INCLUDE("sql.h", "CFLAGS_ODBC")
	&& CHECK_HEADER_ADD_INCLUDE("sqlext.h", "CFLAGS_ODBC")) {
		EXTENSION("odbc", "php_odbc.c", PHP_ODBC_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE("HAVE_UODBC", 1, "ODBC support");
		if ("no" == PHP_ODBCVER) {
			AC_DEFINE("ODBCVER", "0x0350", "The highest supported ODBC version", false);
		} else if ("0" != PHP_ODBCVER) {
			AC_DEFINE("ODBCVER", PHP_ODBCVER, "The highest supported ODBC version", false);
		}
	} else {
		WARNING("odbc support can't be enabled, libraries or header are missing (SDK)")
		PHP_ODBC = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\opcache\\config.w32'));
/* ARG_ENABLE("opcache", "whether to enable Zend OPcache support", "yes"); */


if (PHP_OPCACHE != "no") {

	/* ARG_ENABLE("opcache-jit", "whether to enable JIT", "yes"); */

	ZEND_EXTENSION('opcache', "\
		ZendAccelerator.c \
		zend_accelerator_blacklist.c \
		zend_accelerator_debug.c \
		zend_accelerator_hash.c \
		zend_accelerator_module.c \
		zend_accelerator_util_funcs.c \
		zend_persist.c \
		zend_persist_calc.c \
		zend_file_cache.c \
		zend_shared_alloc.c \
		shared_alloc_win32.c", true, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

	if (PHP_OPCACHE_JIT == "yes") {
		if (CHECK_HEADER_ADD_INCLUDE("dynasm/dasm_x86.h", "CFLAGS_OPCACHE", PHP_OPCACHE + ";ext\\opcache\\jit")) {
			var dasm_flags = (X64 ? "-D X64=1" : "") + (X64 ? " -D X64WIN=1" : "") + " -D WIN=1";
			if (PHP_ZTS == "yes") {
				dasm_flags += " -D ZTS=1";
			}
			DEFINE("DASM_FLAGS", dasm_flags);
			DEFINE("DASM_ARCH", "x86");

			AC_DEFINE('HAVE_JIT', 1, 'Define to enable JIT');
			/* XXX read this dynamically */
			/*ADD_FLAG("CFLAGS_OPCACHE", "/D DASM_VERSION=10400");*/

			ADD_MAKEFILE_FRAGMENT(configure_module_dirname + "\\jit\\Makefile.frag.w32");

			ADD_SOURCES(configure_module_dirname + "\\jit", "zend_jit.c zend_jit_vm_helpers.c", "opcache", "ext\\opcache\\jit");
		} else {
			WARNING("JIT not enabled, headers not found");
		}
	}

	ADD_FLAG('CFLAGS_OPCACHE', "/I " + configure_module_dirname);

}

configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\openssl\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("openssl", "OpenSSL support", "no,shared"); */

if (PHP_OPENSSL != "no") {
	var ret = SETUP_OPENSSL("openssl", PHP_OPENSSL);

	if (ret > 0) {
		EXTENSION("openssl", "openssl.c xp_ssl.c");
		AC_DEFINE("HAVE_OPENSSL_EXT", PHP_OPENSSL_SHARED ? 0 : 1, "Have openssl");
		AC_DEFINE("HAVE_OPENSSL", 1);
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pcre\\config.w32'));
// vim:ft=javascript

EXTENSION("pcre", "php_pcre.c", false /* never shared */,
		"-Iext/pcre/pcre2lib -DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
ADD_SOURCES("ext/pcre/pcre2lib", "pcre2_auto_possess.c pcre2_chartables.c pcre2_compile.c pcre2_config.c pcre2_context.c pcre2_dfa_match.c pcre2_error.c pcre2_jit_compile.c pcre2_maketables.c pcre2_match.c pcre2_match_data.c pcre2_newline.c pcre2_ord2utf.c pcre2_pattern_info.c pcre2_serialize.c pcre2_string_utils.c pcre2_study.c pcre2_substitute.c  pcre2_substring.c pcre2_tables.c pcre2_ucd.c pcre2_valid_utf.c pcre2_xclass.c pcre2_find_bracket.c pcre2_convert.c pcre2_extuni.c pcre2_script_run.c", "pcre");
ADD_DEF_FILE("ext\\pcre\\php_pcre.def");

AC_DEFINE('HAVE_BUNDLED_PCRE', 1, 'Using bundled PCRE library');
AC_DEFINE('PCRE2_CODE_UNIT_WIDTH', 8, 'Have PCRE library');
AC_DEFINE("PCRE2_STATIC", 1, "");
PHP_PCRE="yes";
PHP_INSTALL_HEADERS("ext/pcre", "php_pcre.h pcre2lib/");
ADD_FLAG("CFLAGS_PCRE", " /D HAVE_CONFIG_H");

/* ARG_WITH("pcre-jit", "Enable PCRE JIT support", "yes"); */
if (PHP_PCRE_JIT != "no") {
	AC_DEFINE('HAVE_PCRE_JIT_SUPPORT', 1, 'PCRE library');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pgsql\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pgsql", "PostgreSQL support", "no"); */

if (PHP_PGSQL != "no") {
	if (CHECK_LIB("libpq.lib", "pgsql", PHP_PGSQL) &&
		CHECK_HEADER_ADD_INCLUDE("libpq-fe.h", "CFLAGS_PGSQL", PHP_PGSQL + "\\include;" + PHP_PHP_BUILD + "\\include\\pgsql;" + PHP_PHP_BUILD + "\\include\\libpq;" + PHP_PGSQL)) {
		EXTENSION("pgsql", "pgsql.c", PHP_PGSQL_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE('HAVE_PGSQL', 1, 'Have PostgreSQL library');
		ADD_FLAG("CFLAGS_PGSQL", "/D PGSQL_EXPORTS /D HAVE_PQFREEMEM /D HAVE_PGSQL_WITH_MULTIBYTE_SUPPORT" + (X64 ? " /D HAVE_PG_LO64" : "") + " ");
	} else {
		WARNING("pgsql not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pspell\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pspell", "pspell/aspell (whatever it's called this month) support", "no"); */

if (PHP_PSPELL != "no") {

	if (CHECK_HEADER_ADD_INCLUDE("pspell.h", "CFLAGS_PSPELL", PHP_PHP_BUILD + "\\include\\pspell;" + PHP_PSPELL) &&
			CHECK_LIB("aspell*.lib", "pspell", PHP_PSPELL)) {
		EXTENSION('pspell', 'pspell.c');
		AC_DEFINE('HAVE_PSPELL', 1);
	} else {
		WARNING("pspell not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\readline\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("readline", "Readline support", "yes"); */

if (PHP_READLINE != "no") {
	if (CHECK_LIB("edit_a.lib;edit.lib", "readline", PHP_READLINE) &&
		CHECK_HEADER_ADD_INCLUDE("editline/readline.h", "CFLAGS_READLINE")) {
		EXTENSION("readline", "readline.c readline_cli.c");
		ADD_FLAG("CFLAGS_READLINE", "/D HAVE_LIBEDIT");
		ADD_FLAG("CFLAGS_READLINE", "/D HAVE_RL_COMPLETION_MATCHES");
		ADD_FLAG("CFLAGS_READLINE", "/D HAVE_HISTORY_LIST");
	} else {
		WARNING("readline not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\reflection\\config.w32'));
// vim:ft=javascript

EXTENSION("reflection", "php_reflection.c", false /* never shared */, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
PHP_REFLECTION="yes";
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\session\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("session", "session support", "yes"); */

if (PHP_SESSION == "yes") {
	EXTENSION("session", "mod_user_class.c session.c mod_files.c mod_mm.c mod_user.c", false /* never shared */, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	AC_DEFINE("HAVE_PHP_SESSION", 1, "Session support");
	PHP_INSTALL_HEADERS("ext/session/", "mod_mm.h php_session.h mod_files.h mod_user.h");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\shmop\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("shmop", "shmop support", "no"); */

if (PHP_SHMOP == "yes") {
	EXTENSION("shmop", "shmop.c");
	AC_DEFINE('HAVE_SHMOP', 1, 'Have SHMOP support');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\snmp\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("snmp", "SNMP support", "no"); */

if (PHP_SNMP != "no") {
	if (CHECK_HEADER_ADD_INCLUDE("snmp.h", "CFLAGS_SNMP", PHP_PHP_BUILD + "\\include\\net-snmp;" + PHP_SNMP) &&
		SETUP_OPENSSL("snmp", PHP_SNMP) > 0) {
		if (CHECK_LIB("netsnmp.lib", "snmp", PHP_SNMP)) {
			EXTENSION('snmp', 'snmp.c');
			AC_DEFINE('HAVE_SNMP', 1);
		} else {
			WARNING("snmp not enabled; libraries and headers not found");
		}
	} else {
		WARNING("snmp not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\sockets\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("sockets", "SOCKETS support", "no"); */

if (PHP_SOCKETS != "no") {
	if (CHECK_LIB("ws2_32.lib", "sockets", PHP_SOCKETS)
	&& CHECK_LIB("Iphlpapi.lib", "sockets", PHP_SOCKETS)
	&& CHECK_HEADER_ADD_INCLUDE("winsock.h", "CFLAGS_SOCKETS")) {
		EXTENSION('sockets', 'sockets.c multicast.c conversions.c sockaddr_conv.c sendrecvmsg.c', PHP_SOCKETS_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE('HAVE_SOCKETS', 1);
		PHP_INSTALL_HEADERS("ext/sockets", "php_sockets.h windows_common.h");
		ADD_FLAG("CFLAGS_SOCKETS", "/D PHP_SOCKETS_EXPORTS=1");
	} else {
		WARNING("sockets not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\sodium\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("sodium", "for libsodium support", "no"); */

if (PHP_SODIUM != "no") {
	if (CHECK_LIB("libsodium.lib", "sodium", PHP_SODIUM) && CHECK_HEADER_ADD_INCLUDE("sodium.h", "CFLAGS_SODIUM")) {
		EXTENSION("sodium", "libsodium.c sodium_pwhash.c");
		AC_DEFINE('HAVE_LIBSODIUMLIB', 1 , 'Have the Sodium library');
		PHP_INSTALL_HEADERS("ext/sodium/", "php_libsodium.h");
	} else {
		WARNING("libsodium not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\spl\\config.w32'));
// vim:ft=javascript

EXTENSION("spl", "php_spl.c spl_functions.c spl_iterators.c spl_array.c spl_directory.c spl_exceptions.c spl_observer.c spl_dllist.c spl_heap.c spl_fixedarray.c", false /*never shared */, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
PHP_SPL="yes";
PHP_INSTALL_HEADERS("ext/spl", "php_spl.h spl_array.h spl_directory.h spl_engine.h spl_exceptions.h spl_functions.h spl_iterators.h spl_observer.h spl_dllist.h spl_heap.h spl_fixedarray.h");
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\sqlite3\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("sqlite3", "SQLite 3 support", "no"); */

if (PHP_SQLITE3 != "no") {
	if (SETUP_SQLITE3("sqlite3", PHP_SQLITE3, PHP_SQLITE3_SHARED)) {
		EXTENSION("sqlite3", "sqlite3.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");

		AC_DEFINE("HAVE_SQLITE3", 1, "SQLite support");
		AC_DEFINE("HAVE_SQLITE3_ERRSTR", 1, "have sqlite3_errstr function");
		AC_DEFINE("HAVE_SQLITE3_EXPANDED_SQL", 1, "have sqlite3_expanded_sql function");
	} else {
		WARNING("sqlite3 not enabled; libraries and/or headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\standard\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("password-argon2", "Argon2 support", "no"); */

if (PHP_PASSWORD_ARGON2 != "no") {
	if (CHECK_LIB("argon2_a.lib;argon2.lib", null, PHP_PASSWORD_ARGON2)
	&& CHECK_HEADER_ADD_INCLUDE("argon2.h", "CFLAGS")) {
		if (!CHECK_FUNC_IN_HEADER("argon2.h", "argon2id_hash_raw", PHP_PHP_BUILD + "\\include", "CFLAGS")) {
			ERROR("Please verify that Argon2 header and libraries >= 20161029 are installed");
		}
		AC_DEFINE('HAVE_ARGON2LIB', 1);
	} else {
		WARNING("Argon2 not enabled; libraries and headers not found");
	}
}

/* ARG_WITH("config-file-scan-dir", "Dir to check for additional php ini files", ""); */

AC_DEFINE("PHP_CONFIG_FILE_SCAN_DIR", PHP_CONFIG_FILE_SCAN_DIR);
AC_DEFINE("PHP_USE_PHP_CRYPT_R", 1);

CHECK_HEADER_ADD_INCLUDE("timelib_config.h", "CFLAGS_STANDARD", "ext/date/lib");

ADD_FLAG("LIBS_STANDARD", "iphlpapi.lib");

EXTENSION("standard", "array.c base64.c basic_functions.c browscap.c \
	crc32.c crypt.c crypt_freesec.c crypt_blowfish.c crypt_sha256.c \
	crypt_sha512.c  php_crypt_r.c crc32_x86.c \
	datetime.c dir.c dl.c dns.c dns_win32.c exec.c \
	file.c filestat.c formatted_print.c fsock.c head.c html.c image.c \
	info.c iptc.c lcg.c link.c mail.c math.c md5.c metaphone.c microtime.c \
	net.c pack.c pageinfo.c quot_print.c rand.c mt_rand.c soundex.c \
	string.c scanf.c syslog.c type.c uniqid.c url.c var.c \
	versioning.c assert.c strnatcmp.c levenshtein.c incomplete_class.c \
	url_scanner_ex.c ftp_fopen_wrapper.c http_fopen_wrapper.c \
	php_fopen_wrapper.c credits.c css.c var_unserializer.c ftok.c sha1.c \
	user_filters.c uuencode.c filters.c proc_open.c password.c \
	streamsfuncs.c http.c flock_compat.c random.c hrtime.c", false /* never shared */,
	'/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
PHP_STANDARD = "yes";
ADD_MAKEFILE_FRAGMENT();
PHP_INSTALL_HEADERS("", "ext/standard");
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\sysvshm\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('sysvshm', 'SysV Shared Memory support', 'no'); */

if (PHP_SYSVSHM != 'no') {
	AC_DEFINE('HAVE_SYSVSHM', 1);
	EXTENSION('sysvshm', 'sysvshm.c');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\tidy\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("tidy", "TIDY support", "no"); */

if (PHP_TIDY != "no") {
	var tidy_static = false;
	if ((CHECK_LIB("libtidy_a.lib;tidy_a.lib", "tidy", PHP_TIDY) && (tidy_static = true) ||
		CHECK_LIB("libtidy.lib;tidy.lib", "tidy", PHP_TIDY)) &&
			(
				CHECK_HEADER_ADD_INCLUDE("tidy.h", "CFLAGS_TIDY") ||
				CHECK_HEADER_ADD_INCLUDE("tidy/tidy.h", "CFLAGS_TIDY", null, null, true) ||
				CHECK_HEADER_ADD_INCLUDE("libtidy/tidy.h", "CFLAGS_TIDY", null, null, true)
			)) {

		if (CHECK_HEADER_ADD_INCLUDE("tidybuffio.h", "CFLAGS_TIDY")) {
			AC_DEFINE('HAVE_TIDYBUFFIO_H', 1, 'Have tidybuffio.h header file');
		}

		EXTENSION("tidy", "tidy.c");
		AC_DEFINE('HAVE_TIDY', 1, 'Have TIDY library');
		AC_DEFINE('HAVE_TIDY_H', 1, "tidy include header")
		AC_DEFINE('HAVE_TIDYOPTGETDOC', 1, "tidy_get_opt_doc function")
		AC_DEFINE('HAVE_TIDYRELEASEDATE', 1, "tidy release date function")
		ADD_FLAG('CFLAGS_TIDY', '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
		if (!PHP_TIDY_SHARED) {
			ADD_DEF_FILE("ext\\tidy\\php_tidy.def");
		}
		if (tidy_static) {
			ADD_FLAG("CFLAGS_TIDY", "/DTIDY_STATIC=1");
		}

	} else {
		WARNING("tidy not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\tokenizer\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("tokenizer", "tokenizer support", "yes"); */

if (PHP_TOKENIZER == "yes") {
	EXTENSION("tokenizer", "tokenizer.c tokenizer_data.c");
	AC_DEFINE("HAVE_TOKENIZER", 1, "Tokenizer support");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\zend_test\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("zend-test", "enable zend_test extension", "no"); */

if (PHP_ZEND_TEST != "no") {
	EXTENSION("zend_test", "test.c observer.c fiber.c", PHP_ZEND_TEST_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	ADD_FLAG("CFLAGS_ZEND_TEST", "/D PHP_ZEND_TEST_EXPORTS ");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\zip\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("zip", "ZIP support", "yes"); */

if (PHP_ZIP != "no") {
	if (CHECK_HEADER_ADD_INCLUDE("zip.h", "CFLAGS_ZIP", PHP_PHP_BUILD + "\\include;" + PHP_EXTRA_INCLUDES) &&
		CHECK_HEADER_ADD_INCLUDE("zipconf.h", "CFLAGS_ZIP", PHP_PHP_BUILD + "\\lib\\libzip\\include;" + PHP_EXTRA_LIBS + "\\libzip\\include;" + PHP_ZIP) &&
		(PHP_ZIP_SHARED && CHECK_LIB("libzip.lib", "zip", PHP_ZIP) ||
		 CHECK_LIB("libzip_a.lib", "zip", PHP_ZIP) && CHECK_LIB("libbz2_a.lib", "zip", PHP_ZIP) && CHECK_LIB("zlib_a.lib", "zip", PHP_ZIP) && CHECK_LIB("liblzma_a.lib", "zip", PHP_ZIP))
	) {
		EXTENSION('zip', 'php_zip.c zip_stream.c');

		if (get_define("LIBS_ZIP").match("libzip_a(?:_debug)?\.lib")) {
			/* Using static dependency lib. */
			AC_DEFINE("ZIP_STATIC", 1);
		}

		AC_DEFINE('HAVE_ZIP', 1);
		ADD_FLAG("CFLAGS_ZIP", "/D _WIN32 /D HAVE_SET_MTIME /D HAVE_ENCRYPTION /D HAVE_LIBZIP_VERSION /D HAVE_PROGRESS_CALLBACK /D HAVE_CANCEL_CALLBACK /D HAVE_METHOD_SUPPORTED /D LZMA_API_STATIC");
	} else {
		WARNING("zip not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\zlib\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("zlib", "ZLIB support", "yes"); */

if (PHP_ZLIB == "yes") {
	if (CHECK_LIB("zlib_a.lib;zlib.lib", "zlib", PHP_ZLIB) &&
		CHECK_HEADER_ADD_INCLUDE("zlib.h", "CFLAGS", "..\\zlib;" + php_usual_include_suspects)) {

		EXTENSION("zlib", "zlib.c zlib_fopen_wrapper.c zlib_filter.c", PHP_ZLIB_SHARED, "/D ZLIB_EXPORTS /DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE("HAVE_ZLIB", 1, "ZLIB support");

		if (!PHP_ZLIB_SHARED) {
			ADD_DEF_FILE("ext\\zlib\\php_zlib.def");
		}
	} else {
		WARNING("zlib support can't be enabled, zlib is missing")
		PHP_ZLIB = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\libxml\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("libxml", "LibXML support", "yes"); */

if (PHP_LIBXML == "yes") {
	if (CHECK_LIB("libxml2_a_dll.lib;libxml2_a.lib", "libxml") &&
			CHECK_LIB("libiconv_a.lib;iconv_a.lib;libiconv.lib;iconv.lib", "libxml") &&
			CHECK_HEADER_ADD_INCLUDE("libxml/parser.h", "CFLAGS_LIBXML", PHP_PHP_BUILD + "\\include\\libxml2") &&
			CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_LIBXML", PHP_PHP_BUILD + "\\include\\libxml2") &&
			ADD_EXTENSION_DEP('libxml', 'iconv')) {

		EXTENSION("libxml", "libxml.c", false /* never shared */, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE("HAVE_LIBXML", 1, "LibXML support");
		ADD_FLAG("CFLAGS_LIBXML", "/D LIBXML_STATIC /D LIBXML_STATIC_FOR_DLL /D HAVE_WIN32_THREADS ");
		if (!PHP_LIBXML_SHARED) {
			ADD_DEF_FILE("ext\\libxml\\php_libxml2.def");
		}
		PHP_INSTALL_HEADERS("ext/libxml/", "php_libxml.h");
	} else {
		WARNING("libxml support can't be enabled, iconv or libxml are missing")
		PHP_LIBXML = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\dom\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("dom", "DOM support", "yes"); */

if (PHP_DOM == "yes") {
	if (PHP_LIBXML == "yes" &&
		ADD_EXTENSION_DEP('dom', 'libxml') &&
		CHECK_HEADER_ADD_INCLUDE("libxml/parser.h", "CFLAGS_DOM", PHP_PHP_BUILD + "\\include\\libxml2")
	) {
		EXTENSION("dom", "php_dom.c attr.c document.c \
			domexception.c parentnode.c processinginstruction.c \
			cdatasection.c documentfragment.c domimplementation.c element.c \
			node.c characterdata.c documenttype.c \
			entity.c nodelist.c text.c comment.c \
			entityreference.c \
			notation.c xpath.c dom_iterators.c \
			namednodemap.c");

		AC_DEFINE("HAVE_DOM", 1, "DOM support");

		if (!PHP_DOM_SHARED) {
			ADD_FLAG("CFLAGS_DOM", "/D LIBXML_STATIC ");
		} else {
			if (!CHECK_LIB("libxml2.lib", "dom")) {
				WARNING("dom support can't be enabled, libxml is not found")
			}
		}
		PHP_INSTALL_HEADERS("ext/dom", "xml_common.h");
	} else {
		WARNING("dom support can't be enabled, libxml is not enabled")
		PHP_DOM = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\exif\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE('exif', 'Exchangeable image information (EXIF) Support', 'no'); */

if(PHP_EXIF != 'no')
{
	if(ADD_EXTENSION_DEP('exif', 'mbstring'))
	{
		AC_DEFINE('HAVE_EXIF', 1, 'Have EXIF Support');

		EXTENSION('exif', 'exif.c', null, '/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1');
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\mysqli\\config.w32'));
// vim:ft=javascript

// Note: The extension name is "mysqli", you enable it with "--with-mysqli".
// Passing value "mysqlnd" to it enables the bundled
// client library to connect to the MySQL server, i.e. no external MySQL
// client library is needed to perform the build.

/* ARG_WITH("mysqli", "MySQLi support", "no"); */

if (PHP_MYSQLI != "no") {
	mysqli_source =
		"mysqli.c " +
		"mysqli_api.c " +
		"mysqli_driver.c " +
		"mysqli_exception.c " +
		"mysqli_nonapi.c " +
		"mysqli_prop.c " +
		"mysqli_result_iterator.c " +
		"mysqli_report.c " +
		"mysqli_warning.c";

	if (PHP_MYSQLI == "yes" || PHP_MYSQLI == "mysqlnd") {
		EXTENSION("mysqli", mysqli_source, PHP_MYSQLI_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE('MYSQLI_USE_MYSQLND', 1, 'Using MySQL native driver');
		AC_DEFINE('HAVE_MYSQLILIB', 1, 'Have MySQLi library');
		ADD_EXTENSION_DEP('mysqli', 'mysqlnd', true);
		MESSAGE("\tmysqlnd build");
		PHP_INSTALL_HEADERS("ext/mysqli", "php_mysqli_structs.h");
	} else {
		if (CHECK_LIB("libmysql.lib", "mysqli", PHP_MYSQLI) &&
			CHECK_HEADER_ADD_INCLUDE("mysql.h", "CFLAGS_MYSQLI", PHP_MYSQLI +
										"\\include;" + PHP_PHP_BUILD +
										"\\include\\mysql;" + PHP_MYSQLI)) {
			EXTENSION("mysqli", mysqli_source, PHP_MYSQLI_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
			AC_DEFINE('HAVE_MYSQLILIB', 1, 'Have MySQLi library');
			MESSAGE("\tlibmysql build");
			PHP_INSTALL_HEADERS("ext/mysqli", "php_mysqli_structs.h");
		} else {
			WARNING("mysqli not enabled; libraries and headers not found");
			PHP_MYSQLI = "no"
		}
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("pdo", "Enable PHP Data Objects support", "no"); */

if (PHP_PDO != "no") {
	EXTENSION('pdo', 'pdo.c pdo_dbh.c pdo_stmt.c pdo_sql_parser.c pdo_sqlstate.c', false /* force static, PHP_PDO_SHARED is broken yet somehow */);
	ADD_EXTENSION_DEP('pdo', 'spl', true);
	ADD_MAKEFILE_FRAGMENT();
	PHP_INSTALL_HEADERS("ext/pdo", "php_pdo.h php_pdo_driver.h php_pdo_error.h");
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_dblib\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-dblib", "freetds dblib (Sybase, MS-SQL) support for PDO", "no"); */

if (PHP_PDO_DBLIB != "no") {
	/* if they pointed us to a freetds dir, pick that up,
	 * otherwise we'll poke around and look for MSSQL libs */

	if (CHECK_LIB("sybdb.lib", "pdo_dblib", PHP_PDO_DBLIB) &&
			CHECK_HEADER_ADD_INCLUDE("sybfront.h", "CFLAGS_PDO_DBLIB",
				PHP_PDO_DBLIB, null, null, true))
	{
		EXTENSION("pdo_dblib", "pdo_dblib.c dblib_driver.c dblib_stmt.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		ADD_FLAG('CFLAGS_PDO_DBLIB', "/D PDO_DBLIB_FLAVOUR=\\\"freetds\\\"");
		ADD_EXTENSION_DEP('pdo_dblib', 'pdo');
	} else {
		WARNING("pdo_dblib not enabled, libraries or headers not found")
	}
}

/* ARG_WITH("pdo-mssql", "Native MS-SQL support for PDO", "no"); */

if (PHP_PDO_MSSQL != "no") {
	PDO_DBLIB_FLAVOUR = 0;

	if (CHECK_LIB("sybdb.lib", "pdo_mssql", PHP_PDO_MSSQL) &&
			CHECK_HEADER_ADD_INCLUDE("sybfront.h", "CFLAGS_PDO_MSSQL",
			PHP_PDO_MSSQL, null, null, true)) {
		/* smells like FreeTDS (or maybe native sybase dblib) */
		PDO_DBLIB_FLAVOUR = "freetds";
	}

	if (PDO_DBLIB_FLAVOUR != 0) {
		EXTENSION("pdo_mssql", "pdo_dblib.c dblib_driver.c dblib_stmt.c", null, null, null, "ext\\pdo_mssql");
		ADD_FLAG('CFLAGS_PDO_MSSQL', "/D PDO_DBLIB_FLAVOUR=\\\"" + PDO_DBLIB_FLAVOUR + "\\\"");
		ADD_EXTENSION_DEP('pdo_mssql', 'pdo');
	} else {
		WARNING("pdo_mssql not enabled, libraries or headers not found")
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_firebird\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-firebird", "Firebird support for PDO", "no"); */

if (PHP_PDO_FIREBIRD != "no") {

	if ((CHECK_LIB("fbclient_ms.lib", "pdo_firebird", PHP_PHP_BUILD + "\\interbase\\lib_ms;" + PHP_PDO_FIREBIRD)
			|| CHECK_LIB("gds32_ms.lib", "pdo_firebird", PHP_PHP_BUILD + "\\interbase\\lib_ms;" + PHP_PDO_FIREBIRD)
		) && CHECK_HEADER_ADD_INCLUDE("ibase.h", "CFLAGS_PDO_FIREBIRD",
				PHP_PHP_BUILD + "\\include\\interbase;" + PHP_PHP_BUILD + "\\interbase\\include;" + PHP_PDO_FIREBIRD)
		) {

		EXTENSION("pdo_firebird", "pdo_firebird.c firebird_driver.c firebird_statement.c");
	} else {
		WARNING("pdo_firebird not enabled; libraries and headers not found");
	}
	ADD_EXTENSION_DEP('pdo_firebird', 'pdo');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_mysql\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-mysql", "MySQL support for PDO", "no"); */

if (PHP_PDO_MYSQL != "no") {
	if (PHP_PDO_MYSQL == "yes" || PHP_PDO_MYSQL == "mysqlnd") {
		AC_DEFINE('PDO_USE_MYSQLND', 1, 'Using MySQL native driver');
		STDOUT.WriteLine("INFO: mysqlnd build");
		EXTENSION("pdo_mysql", "pdo_mysql.c mysql_driver.c mysql_statement.c");
		ADD_EXTENSION_DEP('pdo_mysql', 'pdo');
	} else {
		if (CHECK_LIB("libmysql.lib", "pdo_mysql", PHP_PDO_MYSQL) &&
				CHECK_HEADER_ADD_INCLUDE("mysql.h", "CFLAGS_PDO_MYSQL",
					PHP_PDO_MYSQL + "\\include;" +
					PHP_PHP_BUILD + "\\include\\mysql;" +
					PHP_PDO_MYSQL)) {
			EXTENSION("pdo_mysql", "pdo_mysql.c mysql_driver.c mysql_statement.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		} else {
			WARNING("pdo_mysql not enabled; libraries and headers not found");
		}
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_oci\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-oci", "Oracle OCI support for PDO", "no"); */

if (PHP_PDO_OCI != "no") {

	pdo_oci_dirs = new Array(
		PHP_PDO_OCI,
		PHP_PDO_OCI + "\\oci",
		PHP_PHP_BUILD + "\\instantclient10_*\\sdk",
		PHP_PHP_BUILD + "\\oci92"
	);

	pdo_oci_lib_paths = "";
	pdo_oci_inc_paths = "";

	// find the oracle install
	for (i = 0; i < pdo_oci_dirs.length; i++) {
		pdo_oci_lib_paths += pdo_oci_dirs[i] + "\\lib;";
		pdo_oci_lib_paths += pdo_oci_dirs[i] + "\\lib\\msvc;";
		pdo_oci_inc_paths += pdo_oci_dirs[i] + "\\include;";
	}

	pdo_oci_inc_paths += PHP_PHP_BUILD + "\\include\\instantclient;"
	pdo_oci_lib_paths += PHP_PHP_BUILD + "\\lib\\instantclient;";

	pdo_oci_header = CHECK_HEADER_ADD_INCLUDE("oci.h", "CFLAGS_PDO_OCI", pdo_oci_inc_paths, null, null, true);

	if (pdo_oci_header && CHECK_LIB("oci.lib", "pdo_oci", pdo_oci_lib_paths)) {

		pdo_oci_inc_dir = FSO.GetParentFolderName(pdo_oci_header);

		EXTENSION('pdo_oci', 'pdo_oci.c oci_driver.c oci_statement.c');

		/* probe for some functions not present in older versions */
		pdo_oci_inc_dir = FSO.GetFolder(pdo_oci_header);
		CHECK_FUNC_IN_HEADER('oci.h', 'OCIEnvCreate', pdo_oci_inc_dir, 'CFLAGS_PDO_OCI');
		CHECK_FUNC_IN_HEADER('ociap.h', 'OCIStmtFetch2', pdo_oci_inc_dir, 'CFLAGS_PDO_OCI');
		CHECK_FUNC_IN_HEADER('ociap.h', 'OCIEnvNlsCreate', pdo_oci_inc_dir, 'CFLAGS_PDO_OCI');

	} else {
		WARNING("pdo-oci not enabled; libraries and headers not found");
	}
	ADD_EXTENSION_DEP('pdo_oci', 'pdo');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_odbc\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-odbc", "ODBC support for PDO", "no"); */

if (PHP_PDO_ODBC != "no") {
	if (CHECK_LIB("odbc32.lib", "pdo_odbc") && CHECK_LIB("odbccp32.lib", "pdo_odbc")
	&& CHECK_HEADER_ADD_INCLUDE('sql.h', 'CFLAGS_PDO_ODBC')
	&& CHECK_HEADER_ADD_INCLUDE('sqlext.h', 'CFLAGS_PDO_ODBC')) {

		EXTENSION("pdo_odbc", "pdo_odbc.c odbc_driver.c odbc_stmt.c");
		ADD_EXTENSION_DEP('pdo_odbc', 'pdo');

	} else {
		WARNING("pdo_odbc support can't be enabled, headers or libraries are missing (SDK)")
		PHP_PDO_ODBC = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_pgsql\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-pgsql", "PostgreSQL support for PDO", "no"); */

if (PHP_PDO_PGSQL != "no") {
	if (CHECK_LIB("libpq.lib", "pdo_pgsql", PHP_PDO_PGSQL) &&
			CHECK_HEADER_ADD_INCLUDE("libpq-fe.h", "CFLAGS_PDO_PGSQL", PHP_PDO_PGSQL + "\\include;" + PHP_PHP_BUILD + "\\include\\pgsql;" + PHP_PHP_BUILD + "\\include\\libpq;")) {
		EXTENSION("pdo_pgsql", "pdo_pgsql.c pgsql_driver.c pgsql_statement.c");

		if (X64) {
			ADD_FLAG('CFLAGS_PDO_PGSQL', "/D HAVE_PG_LO64=1");
		}

		AC_DEFINE('HAVE_PDO_PGSQL',		1, 'Have PostgreSQL library');

		ADD_EXTENSION_DEP('pdo_pgsql', 'pdo');
	} else {
		WARNING("pdo_pgsql not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\pdo_sqlite\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("pdo-sqlite", "for pdo_sqlite support", "no"); */

if (PHP_PDO_SQLITE != "no") {
	if (SETUP_SQLITE3("pdo_sqlite", PHP_PDO_SQLITE, PHP_PDO_SQLITE_SHARED)) {
		EXTENSION("pdo_sqlite", "pdo_sqlite.c sqlite_driver.c sqlite_statement.c");

		ADD_EXTENSION_DEP('pdo_sqlite', 'pdo');
		AC_DEFINE("HAVE_SQLITE3_COLUMN_TABLE_NAME", 1, "have sqlite3_column_table_name");
		AC_DEFINE("HAVE_SQLITE3_CLOSE_V2", 1, "have sqlite3_close_v2");
	} else {
		WARNING("pdo_sqlite not enabled; libraries and/or headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\phar\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("phar", "disable phar support", "yes"); */
/* ARG_ENABLE("phar-native-ssl", "enable phar with native OpenSSL support", "no"); */

if (PHP_PHAR_NATIVE_SSL != "no") {
	PHP_PHAR = PHP_PHAR_NATIVE_SSL;
}

if (PHP_PHAR != "no") {
	EXTENSION("phar", "dirstream.c func_interceptors.c phar.c phar_object.c phar_path_check.c stream.c tar.c util.c zip.c", PHP_PHAR_SHARED, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
	if (PHP_PHAR_SHARED || (PHP_PHAR_NATIVE_SSL_SHARED && PHP_SNAPSHOT_BUILD == "no")) {
		ADD_FLAG("CFLAGS_PHAR", "/D COMPILE_DL_PHAR ");
	}
	if (PHP_PHAR_NATIVE_SSL != "no") {
		if (CHECK_LIB("libeay32st.lib", "phar")) {
			/* We don't really need GDI for this, but there's no
			way to avoid linking it in the static openssl build */
			ADD_FLAG("LIBS_PHAR", "libeay32st.lib gdi32.lib");
			if (PHP_DEBUG == "no") {
				/* Silence irrelevant-to-us warning in release builds */
				ADD_FLAG("LDFLAGS_PHAR", "/IGNORE:4089 ");
			}
			AC_DEFINE('PHAR_HAVE_OPENSSL', 1);
			STDOUT.WriteLine('        Native OpenSSL support in Phar enabled');
		} else {
			WARNING('Could not enable native OpenSSL support in Phar');
		}
	} else {
		if (PHP_OPENSSL != "no" && !PHP_OPENSSL_SHARED && !PHP_PHAR_SHARED) {
			AC_DEFINE('PHAR_HAVE_OPENSSL', 1);
			STDOUT.WriteLine('        Native OpenSSL support in Phar enabled');
		} else {
			STDOUT.WriteLine('        Native OpenSSL support in Phar disabled');
		}
	}
	ADD_EXTENSION_DEP('phar', 'spl', true);

	ADD_MAKEFILE_FRAGMENT();
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\simplexml\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("simplexml", "Simple XML support", "yes"); */

if (PHP_SIMPLEXML == "yes") {
	if(PHP_LIBXML == "yes" &&
		ADD_EXTENSION_DEP('simplexml', 'libxml') &&
		CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_SIMPLEXML", PHP_PHP_BUILD + "\\include\\libxml2")
	) {
		EXTENSION("simplexml", "simplexml.c");
		AC_DEFINE("HAVE_SIMPLEXML", 1, "Simple XML support");
		if (!PHP_SIMPLEXML_SHARED) {
			ADD_FLAG("CFLAGS_SIMPLEXML", "/D LIBXML_STATIC");
		} else {
			if (!CHECK_LIB("libxml2.lib", "simplexml")) {
				WARNING("simplexml support can't be enabled, libxml is not found")
			}
		}

		if (!ADD_EXTENSION_DEP('simplexml', 'spl', true)) {
			MESSAGE("\tSPL support in simplexml disabled");
		}
		ADD_FLAG("CFLAGS_SIMPLEXML", "/D PHP_SIMPLEXML_EXPORTS ");
		PHP_INSTALL_HEADERS("ext/simplexml/", "php_simplexml.h php_simplexml_exports.h");
	} else {
		PHP_SIMPLEXML = "no";
		WARNING("simplexml not enabled; libraries and headers not found");
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\soap\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("soap", "SOAP support", "no"); */

if (PHP_SOAP != "no") {
	if (PHP_LIBXML == "yes" &&
		ADD_EXTENSION_DEP('soap', 'libxml') &&
		CHECK_HEADER_ADD_INCLUDE("libxml/parser.h", "CFLAGS_SOAP", PHP_PHP_BUILD + "\\include\\libxml2") &&
		CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_SOAP", PHP_PHP_BUILD + "\\include\\libxml2")
		) {
		EXTENSION('soap', 'soap.c php_encoding.c php_http.c php_packet_soap.c php_schema.c php_sdl.c php_xml.c', null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE('HAVE_PHP_SOAP', 1, "SOAP support");

		if (!PHP_SOAP_SHARED) {
			ADD_FLAG('CFLAGS_SOAP', "/D LIBXML_STATIC ");
		}
	} else {
			WARNING("soap not enabled, libxml not found");
			PHP_SOAP = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\xml\\config.w32'));
// vim:ft=javascript

/* ARG_WITH("xml", "XML support", "yes"); */

if (PHP_XML == "yes") {
	if (PHP_LIBXML == "yes" &&
		ADD_EXTENSION_DEP('xml', 'libxml') &&
		CHECK_HEADER_ADD_INCLUDE("libxml/parser.h", "CFLAGS_XML", PHP_PHP_BUILD + "\\include\\libxml2") &&
		CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_XML", PHP_PHP_BUILD + "\\include\\libxml2")
	) {
		EXTENSION("xml", "xml.c compat.c", null, "/DZEND_ENABLE_STATIC_TSRMLS_CACHE=1");
		AC_DEFINE("HAVE_XML", 1, "XML support");
		if (!PHP_XML_SHARED) {
			ADD_FLAG("CFLAGS_XML", "/D LIBXML_STATIC ");
		}
		PHP_INSTALL_HEADERS("", "ext/xml");
	} else {
		WARNING("xml support can't be enabled, libraries or headers are missing")
		PHP_ZLIB = "no"
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\xmlreader\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("xmlreader", "XMLReader support", "yes"); */

if (PHP_XMLREADER == "yes" &&
	PHP_LIBXML == "yes" &&
	CHECK_HEADER_ADD_INCLUDE("libxml/parser.h", "CFLAGS_XMLREADER", PHP_PHP_BUILD + "\\include\\libxml2") &&
	CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_XMLREADER", PHP_PHP_BUILD + "\\include\\libxml2")
	) {
	EXTENSION("xmlreader", "php_xmlreader.c");
	AC_DEFINE("HAVE_XMLREADER", 1, "XMLReader support");
	if (!PHP_XMLREADER_SHARED) {
		ADD_FLAG("CFLAGS_XMLREADER", "/D LIBXML_STATIC");
	}
	ADD_EXTENSION_DEP('xmlreader', 'libxml');
	ADD_EXTENSION_DEP('xmlreader', 'dom');
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\xmlwriter\\config.w32'));
// vim:ft=javascript

/* ARG_ENABLE("xmlwriter", "XMLWriter support", "yes"); */

if (PHP_XMLWRITER == "yes" && PHP_LIBXML == "yes") {
	if (CHECK_HEADER_ADD_INCLUDE('libxml/xmlwriter.h', 'CFLAGS_XMLWRITER', PHP_XMLWRITER + ";" + PHP_PHP_BUILD + "\\include\\libxml2")) {
		EXTENSION("xmlwriter", "php_xmlwriter.c");
		AC_DEFINE("HAVE_XMLWRITER", 1, "XMLWriter support");
		if (!PHP_XMLWRITER_SHARED) {
			ADD_FLAG("CFLAGS_XMLWRITER", "/D LIBXML_STATIC");
		}
		ADD_EXTENSION_DEP('xmlwriter', 'libxml');
	} else {
		WARNING('Could not find xmlwriter.h');
	}
}
configure_module_dirname = condense_path(FSO.GetParentFolderName('C:\\php-sdk-binary-tools\\phpmaster\\vs17\\x64\\php-src\\ext\\xsl\\config.w32'));
// vim: ft=javascript

/* ARG_WITH("xsl", "xsl support", "no"); */

if (PHP_XSL != "no") {
	if (PHP_DOM == "yes" && PHP_LIBXML == "yes"
	&& ADD_EXTENSION_DEP('xsl', 'libxml')
	&& ADD_EXTENSION_DEP('xsl', 'dom')
	&& CHECK_HEADER_ADD_INCLUDE("libxml/tree.h", "CFLAGS_XSL", PHP_PHP_BUILD + "\\include\\libxml2")
	) {
		var ext_xsl_lib_found = false;
		var ext_exslt_lib_found = false;

		if (CHECK_LIB("libxslt_a.lib", "xsl", PHP_XSL)) {
			ext_xsl_lib_found = true;
			ADD_FLAG("CFLAGS_XSL", "/D LIBXSLT_STATIC ");
			if (CHECK_LIB("libexslt_a.lib", "xsl", PHP_XSL)) {
				ADD_FLAG("CFLAGS_XSL", "/D LIBEXSLT_STATIC ");
				ext_exslt_lib_found = true;
			}
		} else if (CHECK_LIB("libxslt.lib", "xsl", PHP_XSL)) {
			ext_xsl_lib_found = true;
			if (CHECK_LIB("libexslt.lib", "xsl", PHP_XSL)) {
				ext_exslt_lib_found = true;
			}
		}

		if (ext_xsl_lib_found && CHECK_HEADER_ADD_INCLUDE("libxslt\\xslt.h", "CFLAGS_XSL")) {
			if (ext_exslt_lib_found) {
				if (CHECK_HEADER_ADD_INCLUDE("libexslt\\exslt.h", "CFLAGS_XSL")) {
					AC_DEFINE("HAVE_XSL_EXSLT", 1, "");
				}
			}
			EXTENSION("xsl", "php_xsl.c xsltprocessor.c", PHP_XSL_SHARED);
			AC_DEFINE("HAVE_XSL", 1, "Define if xsl extension is enabled");
			if (! PHP_XSL_SHARED) {
				ADD_FLAG("CFLAGS_XSL", "/D DOM_EXPORTS /D LIBXML_STATIC");
			} else {
				if (PHP_DEBUG == "yes") {
					ADD_FLAG("LDFLAGS_XSL", "/nodefaultlib:msvcrt");
				}
			}

		} else {
			WARNING("xsl not enabled; libraries and headers not found");
		}
	} else {
		WARNING("xsl not enabled; DOM extension required");
	}
}

// vim:ft=javascript
// tail end of configure

if (!MODE_PHPIZE && sapi_enabled.length < 1) {
	MESSAGE("");
	ERROR("No SAPI selected, please enable at least one SAPI.");
}

generate_files();
