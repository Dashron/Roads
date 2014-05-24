The Roads.js framework is still currently in heavy development. 

## Important Note!
This project now has support for the `yield` keyword. The example assumes you are using it, but it is NOT required to use this project.
To run the example, make sure you have at least node 0.11 and type node --harmony server.js

Code is structured into "Projects". Each project has its own folder structure and primary project.js file.

Project.js defines the resources and routes associated with each project. Each project can be mounted to a first tier url part via the websites configuration file.

Routing is a tree representing the "folder-like" structure of a RESTful URL. Each route key is a url part. Url parts are the text between slashes.

Models are all Roads-Models, but this is not mandatory.

You can get a feel for the structure by looking at all the included projects. The example project works, but is missing some minor features and design. To try it, run the mysql statements below and type `node server.js` from within the roads folder.

mysql required for the example site:

    create database roadsmodelstest;
    create user roadsmodelstest identified by roads;
    grant all on roadsmodelstest.* to roadsmodelstest@'localhost' identified by 'roads';
	create table user ( id int(10) unsigned NOT NULL AUTO_INCREMENT, email varchar(256) NOT NULL, name varchar(128) DEFAULT NULL, password varchar(64) NOT NULL, PRIMARY KEY (`id`) )
	create table session (id int(10) unsigned not null primary key AUTO_INCREMENT, user_id int(10) unsigned not null, session varchar(88) not null, ip varchar(16) not null, user_agent varchar(40) not null, created_on datetime not null)
	create table blog_post (id int(10) unsigned not null primary key AUTO_INCREMENT, user_id int(10) unsigned not null, title varchar(180) not null, body text)
