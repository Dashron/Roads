var GFW = (function () {
	if (typeof Element.prototype.on !== "function") {

		if (typeof Element.prototype.addEventListener === "function") {
			Element.prototype.on = function (event, listener) {
				this.addEventListener.apply(this, [ event, listener ]);
			};
		} else {
			Element.prototype.on = function (event, listener) {
				this.attachEvent.apply(this, [ event, listener ]);
			};
		}

	}
	var Gfw = function Gfw () {
		this.resources = {};
	};

	/**
	 * @param {String}
	 *            selector
	 * @param {Element}
	 *            context
	 * @return {Sizzle}
	 */
	Gfw.prototype.e = Gfw.prototype.element = function (selector, context) {
		var selection = Sizzle(selector, context);

		if (selector.indexOf('#') === 0) {
			return selection[0];
		}

		return selection;
	};

	/**
	 * 
	 * @param {Object}
	 *            object
	 */
	Gfw.prototype.serialize = function (object) {
		var key = null;
		var response = [];
		for (key in object) {
			response.push(key + '=' + object[key]);
		}
		return response.join('&');
	};

	/**
	 * Http
	 * 
	 * @return {Http}
	 */
	Gfw.prototype.Http = {
		get : function (url, details) {
			// response = GFW.serialize(params);
			this.request("GET", url, details.params, details.success, details.error);
		},
		post : function (url, details) {
			this.request("POST", url, details.params, details.success, details.error);
		},
		put : function (url, details) {
			this.request("PUT", url, details.params, details.success, details.error);
		},
		patch : function (url, details) {
			this.request("PATCH", url, details.params, details.success, details.error);
		},
		del : function (url, details) {
			this.request("DELETE", url, details.params, details.success, details.error);
		},
		request : function (method, url, params, success, error) {
			var http = new XMLHttpRequest();
			var response = null;

			http.onreadystatechange = function () {
				if (http.readyState == 4) {
					if (http.status == 200) {
						success(http.responseText);
					} else {
						error(http.responseText, http.status);
					}
				}
			};

			http.open(method, url, true);

			if (method === "POST") {
				response = GFW.serialize(params);
				http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				http.setRequestHeader("Content-length", response.length);
				http.setRequestHeader("Connection", "close");
			}

			http.send(response);
		}
	};

	Gfw.prototype.Template = (function () {
		/**
		 * @param {String}
		 *            html
		 * @return
		 */
		var Template = function Template (html) {
			this.html = html;
			this.data = {};
		};

		/**
		 * 
		 */
		Template.prototype.data = null;

		/**
		 * 
		 * @param data
		 */
		Template.prototype.fill = function (data) {
			for ( var i in data) {
				this.data[i] = data[i];
			}
		};

		/**
		 * 
		 * @param selector
		 */
		Template.prototype.replace = function (selector) {
			// $(selector).replace(this.html);
		};

		/**
		 * 
		 * @param key
		 * @param value
		 */
		Template.prototype.set = function (key, value) {
			if (typeof key != "string") {
				throw new Error("Invalid key assigned to template {" + this.html + "}");
			}
			this.data[key] = value;
		};

		/**
		 * @return {String} TODO: fill the html with the data
		 */
		Template.prototype.toString = function () {
			for ( var i in data) {
				if (Array.isArray(data[i])) {
					// duplicate the template
				} else {
					data[i];
					// assign the data
				}
			}
			return html;
		};

		return Template;
	}());

	/**
	 * Resource
	 * 
	 * @return {Resource}
	 */
	Gfw.prototype.Resource = (function () {
		var Resource = function Resource (name) {
			this.name = name;
			this.templates = {};
		};

		Resource.prototype.templates = null;

		/**
		 * 
		 * @param js_file
		 */
		Resource.prototype.require = function (js_file) {
			var script = document.createElement('script');
			script.type = "text/javascript";
			script.src = '/' + this.name + '/' + js_file;
			document.body.appendChild(script);
		};

		/**
		 * 
		 * @param {String}
		 *            name
		 * @param {Function}
		 *            success Template
		 * @param {Function}
		 *            error error
		 */
		Resource.prototype.template = function (name, details) {
			var _self = this;
			if (typeof _self.templates[name] === "undefined") {
				this.http('template/' + name).get({
					success : function (data) {
						details.success(_self.templates[name] = new GFW.Template(data));
					},
					error : details.error
				});
			} else {
				details.success(_self.templates[name]);
			}
		};

		/**
		 * 
		 * @param path
		 * @returns {Object}
		 */
		Resource.prototype.http = function (path) {
			var _self = this;
			return {
				path : path,
				get : function (details) {
					return GFW.Http.get('/' + _self.name + '/' + this.path, details);
				},
				post : function (details) {
					return GFW.Http.post('/' + _self.name + '/' + this.path, details);
				},
				put : function (details) {
					return GFW.Http.put('/' + _self.name + '/' + this.path, details);
				},
				patch : function (details) {
					return GFW.Http.patch('/' + _self.name + '/' + this.path, details);
				},
				del : function (details) {
					return GFW.Http.del('/' + _self.name + '/' + this.path, details);
				}
			};
		};

		return Resource;
	}());

	Gfw.prototype.resources = null;

	/**
	 * 
	 * @param name
	 * @return {Resource}
	 */
	Gfw.prototype.getResource = function (name) {
		if (typeof this.resources[name] === "undefined") {
			this.resources[name] = new this.Resource(name);
		}

		return this.resources[name];
	};

	return new Gfw();
}());