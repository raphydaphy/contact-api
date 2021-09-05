DROP DATABASE IF EXISTS `contactapi`;

CREATE DATABASE `contactapi` CHARACTER SET UTF8mb4 COLLATE utf8mb4_bin;
GRANT ALL PRIVILEGES ON `contactapi`.* TO 'contactapi'@'localhost';

FLUSH PRIVILEGES;
USE `contactapi`;

CREATE TABLE `mailingLists` (
  listId VARCHAR(16) NOT NULL,
  listName VARCHAR(32) NOT NULL,
  PRIMARY KEY (listId)
) ENGINE=InnoDB;

INSERT INTO mailingLists (listId, listName) VALUES
("william-hennessy", "William Hennessy");

CREATE TABLE `mailingListSignups` (
  listId VARCHAR(16) NOT NULL,
  email VARCHAR(256) NOT NULL,
  signupDate DATE NOT NULL DEFAULT (CURDATE()),
  PRIMARY KEY (listId, email),
  FOREIGN KEY (listId) REFERENCES mailingLists(listId) ON DELETE CASCADE
) ENGINE=InnoDB;