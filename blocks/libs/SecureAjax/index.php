<?php

//авторизация через прямое подключение к серверу с другим портом
//$AuthPort = '56010';

$auth_cnt_uri = dirname($_SERVER['SCRIPT_NAME']);
$test_uri = dirname($auth_cnt_uri);
$OKUri = 'http://' . $_SERVER['HTTP_HOST'] . $auth_cnt_uri . '/result.php';
$FailUri = 'http://' . $_SERVER['HTTP_HOST'] . $auth_cnt_uri . '/fail.php';

if ( isset($AuthPort) ) {
    $ADUri = "http://{$_SERVER['SERVER_NAME']}:$AuthPort$test_uri/auth/test.php";
}
else {
    $ADUri = "http://{$_SERVER['HTTP_HOST']}$test_uri/auth/test.php";
}

error_log('ADUri: '.$ADUri);

setcookie('ADAuthOK', $OKUri, time() + 30, '/');
setcookie('ADAuthFail', $FailUri, time() + 30, '/');

//print "Redirect: ".$ADUri;
header("Location: {$ADUri}");
exit();

?>
