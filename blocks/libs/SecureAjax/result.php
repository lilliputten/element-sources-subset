<?php

header('Content-Type text/html; charset=UTF-8');

if ( isset($_COOKIE['LOGON_USER']) ) {
    echo('_COOKIE["LOGON_USER"]: ' . $_COOKIE['LOGON_USER']);
}
else {
    echo('_COOKIE["LOGON_USER"] not present');
}

?>
