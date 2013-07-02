This is the start of the new Roads framework. 

Currently it only offers a traditional MVC routing system. I plan on pulling the router out into it's own project, and allowing the developer to decide on which router they want to use.

It still needs to be converted to the new folder + dependency structure. IT DOES NOT CURRENTLY WORK!

mysql required for the example site:

    create database roadsmodelstest;
    create user roadsmodelstest identified by roads;
    grant all on roadsmodelstest.* to roadsmodelstest@'localhost' identified by 'roads';
	create table user ( id int(10) unsigned NOT NULL AUTO_INCREMENT, email varchar(256) NOT NULL, name varchar(128) DEFAULT NULL, password varchar(64) NOT NULL, PRIMARY KEY (`id`) )