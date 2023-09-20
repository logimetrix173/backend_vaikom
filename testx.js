const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: '10.10.0.100',
    port: 25,
    secure: false,
    //service: 'smtp',
    auth: {
      user: 'noreply.dochub@acmetelepower.in',
      pass: 'Veer@1234!'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: 'ACME DocHub <noreply.dochub@acmetelepower.in>',
    to: 'veerpratap@acme.in',
    subject: 'Welcome to the platform',
    text: 'Thank you for signing up! Your account has been created successfully.'
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error,"__this is error");
    }else{
        console.log(info,"all are perfect")
    }

})