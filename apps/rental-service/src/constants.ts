export const confirmationHtml = `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Confirmed - CarRental</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Segoe UI', Arial, sans-serif;
      }

      body {
        background-color: #f4f4f4;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .confirmation-container {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        width: 100%;
        padding: 40px 20px;
        text-align: center;
      }

      .success-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      .success-icon svg {
        width: 40px;
        height: 40px;
        fill: white;
      }

      h1 {
        color: #1e3c72;
        margin-bottom: 20px;
        font-size: 28px;
      }

      .message {
        color: #666;
        margin-bottom: 30px;
        line-height: 1.6;
        padding: 0 20px;
      }

      @media (max-width: 480px) {
        .confirmation-container {
          padding: 30px 15px;
        }

        h1 {
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="confirmation-container">
      <div class="success-icon">
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </div>

      <h1>Payment Confirmed!</h1>

      <p class="message">
        Thank you for your payment. Your car rental reservation has been
        successfully confirmed. A confirmation email with detailed information
        has been sent to your registered email address.
      </p>
    </div>
  </body>
</html>`;
