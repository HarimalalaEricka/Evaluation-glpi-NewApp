create table status(
    id integer primary key autoincrement,
    label varchar(255) not null
);

insert into status (label) values ('Nouveau');
insert into status (label) values ('En cours (assigné)');
insert into status (label) values ('Clos');

create table color(
    id integer primary key autoincrement,
    -- label varchar(255) not null,
    color varchar(7) not null,
    background varchar(7) not null,
    idStatusGlpi integer not null,
    idStatus integer,
    FOREIGN KEY (idStatus) REFERENCES status(id)
);

INSERT INTO color (color, background, idStatusGlpi, idStatus)
VALUES ('#f39c12', '#fef5e7', 1, 1);

INSERT INTO color (color, background, idStatusGlpi, idStatus)
VALUES ('#3498db', '#ebf5fb', 2, 2);

INSERT INTO color (color, background, idStatusGlpi, idStatus)
VALUES ('#95a5a6', '#f2f3f4', 6, 3);

create TABLE langue(
    id integer primary key autoincrement,
    langue varchar(255) not null
);

INSERT INTO langue (langue)
VALUES ('Français');

INSERT INTO langue (langue)
VALUES ('Malgache');

INSERT INTO langue (langue)
VALUES ('Anglais');

create table traduction(
    id integer primary key autoincrement,
    idLangue integer not null,
    idStatus integer not null,
    traduction varchar(255),
    FOREIGN KEY (idLangue) REFERENCES langue(id),
    FOREIGN KEY (idStatus) REFERENCES status(id)
);

insert into traduction (idLangue, idStatus, traduction) values (1, 1, 'Nouveau');
insert into traduction (idLangue, idStatus, traduction) values (1, 2, 'En cours (assigné)');
insert into traduction (idLangue, idStatus, traduction) values (1, 3, 'Clos');
insert into traduction (idLangue, idStatus, traduction) values (2, 1, 'Vaovao');
insert into traduction (idLangue, idStatus, traduction) values (2, 2, 'Efa Manao');
insert into traduction (idLangue, idStatus, traduction) values (2, 3, 'Vita');

insert into traduction (idLangue, idStatus) values (3, 1);
insert into traduction (idLangue, idStatus) values (3, 2);
insert into traduction (idLangue, idStatus) values (3, 3);
