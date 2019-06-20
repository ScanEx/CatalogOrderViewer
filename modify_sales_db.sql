CREATE TABLE roi (
	roi_id SERIAL PRIMARY KEY,
	roi_name CHARACTER VARYING,
	file_path CHARACTER VARYING,
	order_id INT REFERENCES orders(orderid)
);

ALTER TABLE ord_granules ADD uid SERIAL;

ALTER TABLE ord_granules ADD CONSTRAINT gran_uk UNIQUE(uid);

CREATE TABLE roi_gran (
	roi_id INT REFERENCES roi(roi_id),
	gran_id INT REFERENCES ord_granules(uid),
	CONSTRAINT roi_gran_pk PRIMARY KEY (roi_id, gran_id)
);