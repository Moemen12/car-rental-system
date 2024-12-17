# 🚗 Advanced Car Rental System

A sophisticated car rental platform built with NestJS, featuring microservices architecture, real-time processing, and advanced security features.

## 🌟 Key Features

- Microservice Architecture with API Gateway
- Role-Based Access Control (RBAC)
- Advanced Car Search with Algolia Integration
- Real-time Payment Processing with Stripe
- Automated Document Verification (Driver's License) using Tesseract.js
- Automated Email Notifications
- Rate Limiting and Security Features
- Response Compression
- Redis Caching
- Message Queue System (RabbitMQ)
- Comprehensive Error Tracking

## 🛠️ Tech Stack

- **Backend Framework**: NestJS
- **Database**: MongoDB
- **Caching**: Redis
- **Message Broker**: RabbitMQ
- **Search Engine**: Algolia
- **Payment Processing**: Stripe
- **File Upload**: UploadThing
- **OCR Processing**: Tesseract.js
- **Email Service**: Gmail SMTP
- **Development**: MonoRepo Architecture

## 📋 API Endpoints

### Authentication

|                               Method                                | Endpoint             | Description         |
| :-----------------------------------------------------------------: | -------------------- | ------------------- |
| ![POST](https://img.shields.io/badge/POST-FF4D4D?style=flat-square) | `/api/auth/login`    | User authentication |
| ![POST](https://img.shields.io/badge/POST-FF4D4D?style=flat-square) | `/api/auth/register` | User registration   |

### User Management

|                                 Method                                  | Endpoint                 | Description         |
| :---------------------------------------------------------------------: | ------------------------ | ------------------- |
|    ![GET](https://img.shields.io/badge/GET-4CAF50?style=flat-square)    | `/api/users/:id/profile` | Get user profile    |
|  ![PATCH](https://img.shields.io/badge/PATCH-FFA500?style=flat-square)  | `/api/users/:id/profile` | Update user profile |
| ![DELETE](https://img.shields.io/badge/DELETE-FF0000?style=flat-square) | `/api/users/:id`         | Delete user account |

### Car Management

|                                Method                                 | Endpoint               | Description       |
| :-------------------------------------------------------------------: | ---------------------- | ----------------- |
|  ![POST](https://img.shields.io/badge/POST-FF4D4D?style=flat-square)  | `/api/cars`            | Add new car       |
|   ![GET](https://img.shields.io/badge/GET-4CAF50?style=flat-square)   | `/api/cars/search`     | Search cars       |
| ![PATCH](https://img.shields.io/badge/PATCH-FFA500?style=flat-square) | `/api/cars/:id/status` | Update car status |

### Rental Management

|                               Method                                | Endpoint                                | Description              |
| :-----------------------------------------------------------------: | --------------------------------------- | ------------------------ |
| ![POST](https://img.shields.io/badge/POST-FF4D4D?style=flat-square) | `/api/rentals`                          | Create rental            |
|  ![GET](https://img.shields.io/badge/GET-4CAF50?style=flat-square)  | `/api/rentals/payment-confirmation/:id` | Get payment confirmation |
|  ![GET](https://img.shields.io/badge/GET-4CAF50?style=flat-square)  | `/api/rentals/active`                   | Get active rentals       |

## 🏗️ Project Structure

```
car-rental-system/
├── apps/
│   ├── api-gateway/
│   ├── user-service/
│   ├── car-service/
│   └── rental-service/
|   └── email-service/
└── libs/
    └── common/
    └── database/
```

## 📧 Automated Emails

The system sends automated emails for:
- Welcome messages
- Payment confirmations
- Rental invoices

<table style="border-collapse: collapse; width: 100%;">
<tr>
<th align="center" width="33%" style="padding: 10px;">Payment Confirmation</th>
<th align="center" width="33%" style="padding: 10px;">Invoice</th>
<th align="center" width="33%" style="padding: 10px;">Welcome Email</th>
</tr>
<tr>
<td align="center" style="padding: 10px;">
<img src="https://github.com/Moemen12/car-rental-system/blob/main/public/images/payment-confirmation.png" width="300" alt="Payment Confirmation Email"/>
</td>
<td align="center" style="padding: 10px;">
<img src="https://github.com/Moemen12/car-rental-system/blob/main/public/images/invoice.png" width="300" alt="Invoice Email"/>
</td>
<td align="center" style="padding: 10px;">
<img src="https://github.com/Moemen12/car-rental-system/blob/main/public/images/welcome.png" width="300" alt="Welcome Email"/>
</td>
</tr>
</table>

## ⚙️ Environment Variables

```env
# Debug Mode
DEBUG_MODE=true  # Enable to see expected/unexpected errors in console

# Application
APP_URL=http://localhost:3000/api

# Database
MONGODB_URI=mongodb://localhost:27017/car-rental-users

# Message Queue
RABBITMQ_URL=amqp://localhost:5672
USER_EMAIL_QUEUE_NAME=user_email_queue
USER_EMAIL_QUEUE_TTL=1  # Welcome Email (in days)
RENTAL_EMAIL_QUEUE_NAME=rental_email_queue
RENTAL_EMAIL_QUEUE_TTL=60  # Payment confirmation queue (in seconds)

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=5  # Caching time in minutes

# JWT Configuration
# Generate using: openssl rand -base64 64
JWT_SECRET_KEY=your_jwt_secret_here

# Encryption
# Generate using: openssl rand -hex 32
ENCRYPTION_KEY=your_encryption_key_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
USER_EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Rate Limiting
THROTTLER_TTL=60  # Time window in seconds
THROTTLER_LIMIT=30  # Maximum requests within TTL
THROTTLER_BLOCK_DURATION=300  # Block duration in seconds

# Third-Party Services
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
STRIPE_API_KEY=your_stripe_api_key
UPLOADTHING_TOKEN=your_uploadthing_token

# Microservices
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=1111
CAR_SERVICE_HOST=localhost
CAR_SERVICE_PORT=3434
RENT_SERVICE_HOST=localhost
RENT_SERVICE_PORT=3666
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- MongoDB
- Redis
- RabbitMQ
- Gmail Account (for email notifications)

### Installation and Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Update the .env file with your configurations
```

4. Start the development server:

```bash
npm run dev:all
```

## 🔍 Debug Mode

When `DEBUG_MODE=true`, the system provides detailed error logging with color-coded console outputs:

- 🔴 Microservice Exceptions (Red)
- 🔵 RPC Exceptions (Blue)

## 🔒 Security Features

- JWT Authentication
- Role-Based Access Control
- Request Rate Limiting
- Response Compression
- Encrypted Sensitive Data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
