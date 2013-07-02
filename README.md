This is the start of the new Roads framework. 

Currently it only offers a traditional MVC routing system. I plan on pulling the router out into it's own project, and allowing the developer to decide on which router they want to use.

It still needs to be converted to the new folder + dependency structure. IT DOES NOT CURRENTLY WORK!

create database roadsmodelstest;
create user roadsmodelstest identified by roads;
grant all on roadsmodelstest.* to roadsmodelstest@'localhost' identified by 'roads';