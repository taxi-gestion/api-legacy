# __PROJECT api

__ABOUT

## Table of Contents

- 🪧 [About](#about)
- 📦 [Prerequisites](#prerequisites)
- 🚀 [Installation](#installation)
- 🛠️ [Usage](#usage)
- 🤝 [Contribution](#contribution)
- 🏗️ [Built with](#built-with)
- 📝 [License](#license)

## Prerequisites

- [Git](https://git-scm.com/): Distributed version control system for a set of files
- [Node](https://nodejs.org/): Runtime environment for Javascript

> Node can be installed via [nvm](https://github.com/nvm-sh/nvm), which allows you to quickly get and use different versions of Node via the command line.

## Installation

Clone the project

### Setting up the prerequisites

```bash
npm install
```

## Usage

These commands are used in the context of application development and should be run from the root of the workspace.

### Launch the local API server

```bash
npm run build
npm run start-local
```

### Database for local development

Common development commands are found in the scripts field of package.json
The API relies on a [PostgreSQL](https://www.postgresql.org/) database service which can be set up locally on docker.

Docker one-liner
To set up a blank database for testing

```bash
docker run -d \
--name postgres \
--rm \
--shm-size=512m \
-p 5432:5432 \
-e POSTGRES_DB=database \
-e POSTGRES_USER=postgres \
-e POSTGRES_PASSWORD=password \
-v "$(pwd)/docker-data/postgresql:/var/lib/postgresql/data" \
postgres:14.6
```

Testing

```shell
❯ curl  http://0.0.0.0:3000                                                                                                                                                                                                                                          1.64   14,6G   0,B   100% 
OK
```

Without a database

```shell
Copy code
❯ curl  http://0.0.0.0:3000/database-status                                                                                                                                                                                                                                1.60   14,6G   0,B   100% 
{"statusCode":500,"code":"ECONNREFUSED","error":"Internal Server Error","message":"connect ECONNREFUSED 127.0.0.1:5432"}%
```

With a blank database

```shell
Copy code
❯ curl  http://0.0.0.0:3000/database-status                                                                                                                                                                                                                                1.18   14,8G   0,B   100% 
{"databaseSize":{"pg_size_pretty":"8553 kB"},"numberOfConnexions":{"count":"1"},"numberOfActiveConnexions":{"count":"1"},"listOfAllPublicTables":"[]"}%
```

### Contribution

The project is currently not open to contributions.

### Tools

#### CI/CD

[Github Actions](https://docs.github.com/en/actions) is the integrated Continuous Integration and Deployment tool in GitHub

The deployment history is available [under the Actions tab](https://github.com/__ORGANIZATION/__REPOSITORY/actions/)

- Repository Secrets:

  - `AWS_ACCESS_KEY_ID`: The ID of the key for the programmatic account that allows pushing the container image onto ECR
    - Provisioned by the organization deployer of the parent AWS organization account
  - `AWS_SECRET_ACCESS_KEY`: The secret key of the programmatic account that allows pushing the container image onto ECR
    - Provisioned by the organization deployer of the parent AWS organization account

- [AWS](https://aws.amazon.com/) is the Cloud services platform offered by Amazon.

  - User: `__PROJECT.api.ci`
  - Group: `api.deployer`

- [ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html) Amazon Elastic Container Registry (Amazon ECR) is a managed container image registry service by AWS.

## License

See the [LICENSE.md](./LICENSE.md) file in the repository.
