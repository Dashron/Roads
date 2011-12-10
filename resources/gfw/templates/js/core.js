var GFW = (function () {
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
		
		if(selector.indexOf('#') === 0) {
			return selection[0];
		}
		
		return selection;
	};

	/**
	 * Http
	 * 
	 * @return {Http}
	 */
	Gfw.prototype.Http = {
		get : function (url, params, success, error) {
			this.request("GET", url, params, success, error);
		},
		post : function (url, params, success, error) {
			this.request("POST", url, params, success, error);
		},
		put : function (url, params, success, error) {
			this.request("PUT", url, params, success, error);
		},
		patch : function (url, params, success, error) {
			this.request("PATCH", url, params, success, error);
		},
		del : function (url, params, success, error) {
			this.request("DELETE", url, params, success, error);
		},
		request : function (method, url, params, success, error) {
			var xmlhttp = new XMLHttpRequest();

			xmlhttp.onreadystatechange = function () {
				if (xmlhttp.readyState == 4) {
					if (xmlhttp.status == 200) {
						success(xmlhttp.responseText);
					} else {
						error(xmlhttp.responseText, xmlhttp.status);
					}
				}
			};

			xmlhttp.open(method, url, true);
			xmlhttp.send();
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
		Resource.prototype.template = function (name, success, error) {
			var _self = this;
			if (typeof _self.templates[name] === "undefined") {
				GFW.Http.get('/' + _self.name + '/template/' + name, {}, function (data) {
					success(_self.templates[name] = new GFW.Template(data));
				});
			} else {
				success(_self.templates[name]);
			}
		};

		/**
		 * 
		 * @param path
		 * @returns {Object}
		 */
		Resource.prototype.http = function (path) {
			return {
				path : path,
				get : function (params, success, error) {
					return GFW.Http.get('/' + this.name + '/' + this.path, params, success, error);
				},
				post : function (params, success, error) {
					return GFW.Http.post('/' + this.name + '/' + this.path, params, success, error);
				},
				put : function (params, success, error) {
					return GFW.Http.put('/' + this.name + '/' + this.path, params, success, error);
				},
				patch : function (params, success, error) {
					return GFW.Http.patch('/' + this.name + '/' + this.path, params, success, error);
				},
				del : function (params, success, error) {
					return GFW.Http.del('/' + this.name + '/' + this.path, params, success, error);
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