const loggs = require("../models/logsdetails/alllogs");
const User = require("../models/add_user");

const cron = require('node-cron');
const nodemailer = require('nodemailer');

// ... Other necessary imports and setup code ...

// Function to send daily email notifications
const sendDailyEmail = async (recipients) => {
  try {
      const events = await loggs.findAll({
        where: {
          category: ['Create', 'Delete', 'Shared'], // Filter by category
          timestamp: {
            [Op.gte]: Date.now() - (24 * 60 * 60 * 1000)
          },
        },
      });
      // console.log(events,"______________events")
      // console.log(events.length,"______________eventsLength")
    // user_id => fetch data from user_model and fetch the email of user
    //run loop for every events to add who did the changes


    if (events.length === 0) {
      console.log('No events to notify');
      return;
    }

    // Prepare the email content based on the events
    // let emailContent = 'Daily Event Summary:\n\n';
    // for (const event of events) {
    //   emailContent += `User ${event.user_id} ${event.action}\n`;
    // }
    // let emailContent = '<table border="1">';
    //   for (const event of events) {
    //     emailContent += `
    //       <tr>
    //         <td>User ${event.user_id}</td>
    //         <td>${event.action}</td>
    //       </tr>
    //     `;
    //   }
    //   emailContent += '</table>';
    let emailContent = '<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">'; // Added cellpadding and cellspacing
        for (const event of events) {
          emailContent += `
            <tr>
              <td>User ${event.user_id}</td>
              <td>${event.action}</td>
            </tr>
          `;
        }
        emailContent += '</table>';



    // Send the email
    const transporter = nodemailer.createTransport({
      // Configure your email transport settings here
      host: '10.10.0.100',
      port: 25,
      secure: false,
      auth: {
        user: 'noreply.dochub@acmetelepower.in',
        pass: 'Veer@1234!'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const htmlContent = `
    <html>
      <img src="cid:acmeLogo" alt="acme_logo" height="100px" width="170px">
      <p> Dear Admin ,</p>
      <p>The following changes have been made in the last 24 hours</p>
      <p>${emailContent}</p>
      <p>Regards,</p>
      <p>ACME DocHub</p>
    </html>`;

    // for (const recipient of recipients) {

      const mailOptions = {
        from: 'ACME DocHub <noreply.dochub@acmetelepower.in>',
        // to: recipient.email,
        to :"logimetrix13@gmail.com",
        subject: 'Daily Event Summary',
        html:htmlContent,
        attachments: [
          {
            filename: 'acmeLogo.jpeg',
            path: 'img/acmeLogo.5737c13751454da74081.jpeg',
            cid: 'acmeLogo', // Make sure the CID matches the image src in the HTML
          },
        ],
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Daily Email sent:', info.response);
    // }
  } catch (error) {
    console.error('Error sending daily email:', error);
  }
};
// const recipients = await User.findAll({where:{
//   user_type:"Admin"
// }})
async function fetchDataFromUserDatabase() {
  try {
    const data = await User.findAll({ where: { user_type: "Admin" } });
    // Process the fetched data here
    sendDailyEmail(data)
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
// Schedule the cron job to run daily at 8 PM

// cron.schedule('59 19 * * *', fetchDataFromUserDatabase);
cron.schedule('35 10* * *', sendDailyEmail);
