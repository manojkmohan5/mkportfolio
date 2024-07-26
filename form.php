<?php 
    $name = $_POST['name'];
    $visitor_email = $_POST['email'];
    $message = $_POST['message'];


    $email_from = '';

    $email_subject = "Form Submission";

    $email_body = "User Name: $name.\n".
                    "User EMail: $visitor_email.\n".
                      "User Message: $message.\n";


    $to = "manojkmohan5@gmail.com";

    $headers .= "Replt-To: $visitor_email \r\n";

    mail($to,$mail_subject,$email_body,$headers);

    header ("location: index.html")