<h1 align=center>Beauty Salon Management Solution</h1>

[![Build Status](https://drone.bs.devset.app/api/badges/blz-ea/bms/status.svg)](https://drone.bs.devset.app/blz-ea/bms)

This is a beauty salon management solution built using React.js and Node.js.

### [Demo](https://book.bms.devset.app/) ###

## Features ##

- Add and manage appointments
  - Send Appointment notifications to clients
  - Send Slack notifications to employees
  - Verify client mobile phones using [Firebase](https://firebase.google.com/docs/auth/android/phone-auth)
- Booking frontend for clients
  - Add and manage appointments
- Digital Queue for walk-in clients
- Staff management
  - Ability to manage staff queue using [Flic.io](https://flic.io) buttons
- Client management
- Role based access control
- Real-time notification system of customer arrival
- YouTube video player using YouTube API

## [Screenshots](https://devset.app/project-bms-media-redirect) ##

## Development ##

**Step 0**

Clone this repository
```
git clone git@github.com:blz-ea/bms.git
```

**Step 1**

Modify `.env.default` or add you configuration to `.env.development`

**Step 2**

```cli
yarn init:all
```

**Step 3: Start development environment**

```cli
yarn dev
```

or start each component separately

```cli
yarn dev:admin
yarn dev:booking
yarn dev:backend
```

**Step 4: Access WEB UI**

**Admin Dashboard**

- localhost:3000
- Default **Login/Password**: admin@demo.org/demodemo

**Booking Frontend**

- localhost:3005

**Api Dashboard**

- localhost:3010/admin
- Default **Login/Password**: demo/demo123

## Deployment ##

- Full Terraform deployment example can be found in [terraform](./terraform) folder
- Example of deploying using [docker compose](./docker-compose.yml)
  - If necessary add entries to `.env.production`
  - `yarn run production:docker:build` - build frontend and backend
  - `yarn run production:docker:compose:up` - create images and start containers
  - `yarn run production:docker:compose:down` - destroy all containers

## [Index of environment variables](./.env.default) ##

## TODO ##

- Refactor
- Add Ability to manage services and inventory in UI
- Add Tests
- Finish with translation
