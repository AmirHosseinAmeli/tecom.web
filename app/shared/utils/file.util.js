'use strict';

app.factory('fileUtil', ['ArrayUtil', function (ArrayUtil) {

  var textBaseFormats = ['txt', 'c', 'js', 'java', 'py', 'cpp',
    'css', 'apsx', 'htm', 'jsp', 'php', 'xml', 'asp', 'rdf', 'cs', 'fs', 'lib',
    's', 'src', 'dtd', 'bat', 'o', 'mm', 'swift', 'cc', 'lua', 'prl', 'mac',
    'phtml', 'sh', 'h', 'html5', 'cxx', 'vb', 'r', 'cls', 'pyt', 'cmd', 'rb',
    'p', 'php3', 'cbl', 'perl', 'f', 'dtx', 'sub', 'ptl', 'ksf', 'dsd', 'mak',
    'scpt', 'less', 'run', 'cp', 'm', 'obj', 'lpx', 'ascx', 'coffee', 'script',
    'rh', 'jade', 'j', 'jav', 'xtx', 'c#', 'f#', 'f95', 'mf', 'devpak', 'f90',
    'phps', 'ruby', 'command', 'jcs', 'scala', 'for',
    'bsh', 'c++', 'dfn', 'php2', 'iml', 'php5', 'hc', 'make', 'vim', 'ogr',
    'sass', 'cuh', 'vc6', 'cobol', 'rdoc', 'sql', 'rub', 'playground', 'phs',
    'pdr', 'xib', 'vbscript', 'rc3', 'php1', 'hxx', 'd', 'proto', 'asp+',
    'snippet', 'cu', 'applescript', 'git', 'ijs', 'ftn', 'pbp', 'cfo', 'map',
    'rb', 'xpdl', 'vmx', 'common', 'go', 'login', 'udf', 'a', 'sbs', 'chh',
    'phpt', 'gemfile', 'class', 'pp', 'hh', 'b', 'mst', 'cola', 'zsh', 'ahtml',
    'rex', 'mod', 'has', 'w', 'reb', 'msc', 'rake', 'tcsh', 'tql', 'erl', 'hpp',
    'gml', 'rbx', 'mli', 'pdl', 'pxi', 'simba', 'xmljet', 'fpp', 'pdl', 'gs',
    'rs', 'magik', 'cr2', 'gst', 'con', 'sit', 'qf', 'gnumakefile', 'fdo', 'epp',
    'emakefile', 'sw', 'ks', 'm2', 'pm6', 'p5', 'adiumscripts', 'eql', 'lit',
    'xmss', 'seestyle', 'makefile', 'sjava', 'emakerfile', 'cuo', 'rtf'];

  function isTextFormat(format) {
    return ArrayUtil.contains(textBaseFormats, format);
  }

  return {
    isTextFormat: isTextFormat
  };
}]);