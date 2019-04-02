(function() {
    Array.prototype.indexOf = Array.prototype.indexOf || function(item, field) {
        for (var i = 0, j = this.length; i < j; i++) {
            if (this[i] === item) {
                return i;
            }
        }
        return -1;
    }
    Array.prototype.fieldIndexOf = function(item, field) {
        for (var i = 0, j = this.length; i < j; i++) {
            var obj = this[i];
            if (item[field]) {
                if (obj[field] === item[field])
                    return i;
            } else
            if (obj[field] === item) {
                return i;
            }
        }
        return -1;
    }
    String.prototype.trim = String.prototype.trim || function() {
        return this.replace(/(^\s*)|(\s*$)/g, "");
    }
})();
var Titanium = {
    createNew: function() {
        var Titan = {
            version: null,
            loadTimeOut: 20,
            mainFrame: null,
            defaultPage: "/",
            pathTail: ".html",
            Win: null
        };

        Titan.IsIE8 = false;
        if (navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i) == "8.") {
            Titan.IsIE8 = true;
        }
        Titan.getDate = function(date, format) {
            if (!date) return "";
            var time = new Date(parseFloat(date));
            var o = {
                "M+": time.getMonth() + 1, //月份
                "d+": time.getDate(), //日
                "h+": time.getHours(), //小时
                "m+": time.getMinutes(), //分
                "s+": time.getSeconds(), //秒
                "q+": Math.floor((time.getMonth() + 3) / 3), //季度
                "S": time.getMilliseconds() //毫秒
            };
            if (!format) {
                format = 'yyyy-MM-dd hh:mm:ss';
            }
            if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return format;
        }
        Titan.trace = function(log) {
            console.log(log);
        };
        Titan.element = function(id) {
            var result = document.getElementById(id);
            if (!result)
                result = { appendChild: function() {} };
            return result;
        };

        function createXMLHttpRequest() {
            var xmlHttp;
            if (typeof XMLHttpRequest != "undefined") {
                xmlHttp = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                var aVersions = ["Msxml2.xmlHttp.5.0", "Msxml2.xmlHttp.4.0", "Msxml2.xmlHttp.3.0", "Msxml2.xmlHttp", "Microsoft.xmlHttp"];
                for (var i = 0; i < aVersions.length; i++) {
                    try {
                        xmlHttp = new ActiveXObject(aVersions[i]);
                        break;
                    } catch (e) {}
                }
            }
            return xmlHttp;
        };
        Titan.loadRes = function(req, callback, timeout) {
            if (!timeout) {
                timeout = Titan.loadTimeOut;
            }
            var url = req.url;
            if (url.indexOf('http') != 0 && url.indexOf('/') != 0) {
                url = getRelUrl() + '/' + url;
            }
            timeout = timeout * 1000;
            var xmlHttp = createXMLHttpRequest();
            if (xmlHttp != null) {
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState == 4) {
                        if (callback)
                            callback(xmlHttp.status, xmlHttp.response ? xmlHttp.response : xmlHttp.responseText);
                        callback = undefined;
                    }
                }
                if (req.method) {
                    xmlHttp.open(req.method, url, true);
                } else {
                    if (req.body) {
                        xmlHttp.open("POST", url, true);
                    } else {
                        xmlHttp.open("GET", url, true);
                    }
                }
                if (req.contentType) {
                    xmlHttp.setRequestHeader('Content-Type', req.contentType);
                }
                xmlHttp.timeout = timeout;
                if (req.body) {
                    xmlHttp.send(req.body);
                } else {
                    xmlHttp.send(null);
                }
            } else {
                this.trace("Your browser does not support xmlHttp.");
            }
        };
        Titan.Json = function(data) {
            if (data.ti_bind_object) {
                return JSON.stringify(data.ti_bind_object);
            } else {
                return JSON.stringify(data)
            }
        }
        Titan.clone = function(obj) {
            return JSON.parse(this.Json(obj));
        }
        Titan.loadJson = function(req, callback, timeout) {
            if (!timeout) {
                timeout = Titan.loadTimeOut;
            }
            if (req.body) {
                req.body = this.Json(req.body);
                req.contentType = 'application/json; charset=utf-8';
            }
            Titan.loadRes(req, function(status, response) {
                if (status >= 200 && status < 300) {
                    callback({ status: status, body: JSON.parse(response) });
                } else if (Titan.Win && status == 401) {
                    Titan.Win.loading(true);
                    Titan.Win.toast('登录已超期，2秒后返回登录页');
                    setTimeout(function() {
                        window.location = "login.html";
                    }, 2000);
                } else {
                    callback({ status: status, body: response ? JSON.parse(response) : {} });
                }
            }, timeout);
        };
        Titan.loadScript = function(path, onload, scriptType, charset) {
            var node = document.createElement('script');
            if (scriptType)
                node.type = scriptType;
            else
                node.type = 'text/javascript';
            if (charset)
                node.charset = charset;
            else
                node.charset = 'utf-8';
            node.async = false;
            node.src = path + '.js';
            node.ti_bind_path = path;
            if (Ti.IsIE8) {
                node.onreadystatechange = function() {
                    if (this.readyState && (this.readyState == 'loaded' || this.readyState == 'complete')) {
                        onload();
                    }
                }
            } else {
                node.onload = onload;
            }
            window.document.getElementsByTagName('head')[0].appendChild(node);
            return node;
        };
        Titan.unloadScript = function(path) {
            var childs = document.getElementsByTagName('script');
            var result = false;
            for (var i = childs.length - 1; i >= 0; i--) {
                if (childs[i].ti_bind_path && childs[i].ti_bind_path === path) {
                    childs[i].parentNode.removeChild(childs[i]);
                    result = true;
                }
            }
            return result;
        };
        Titan.unloadRes = function(url) {
            var childs = document.getElementsByTagName('script');
            var result = false;
            for (var i = childs.length - 1; i >= 0; i--) {
                if (childs[i].src && childs[i].src.toLowerCase().indexOf(url.toLowerCase()) >= 0) {
                    childs[i].parentNode.removeChild(childs[i]);
                    result = true;
                }
            }
            childs = document.getElementsByTagName('link');
            for (var i = childs.length - 1; i >= 0; i--) {
                if (childs[i].href && childs[i].href.toLowerCase().indexOf(url.toLowerCase()) >= 0) {
                    childs[i].parentNode.removeChild(childs[i]);
                    result = true;
                }
            }
            var child = document.getElementById(url);
            if (child) {
                child.parentNode.removeChild(child);
            }
            return result;
        };
        Titan.loadLocalStorage = function(name) {
            if (localStorage)
                return localStorage.getItem(name);
            return null;
        };
        Titan.saveLocalStorage = function(name, value) {
            if (localStorage)
                localStorage.setItem(name, value);
        };
        Titan.clearLocalStorage = function() {
            if (localStorage)
                localStorage.clear();
        };
        Titan.explainElement = function(ti_bind_element) {
            if (ti_bind_element instanceof Element) {
                ti_bind_element_children(ti_bind_element);
            } else {
                ti_bind_element_children(this.element(ti_bind_element));
            }
        }

        function getRelUrl() {
            var url = document.location.toString();
            var arrUrl = url.split("//");
            arrUrl = arrUrl[1].split("#");
            var relUrl = arrUrl[0].substring(arrUrl[0].indexOf("/"), arrUrl[0].lastIndexOf("/")); //stop省略，截取从start开始到结尾的所有字符
            if (!relUrl)
                relUrl = '';
            return relUrl;
        };

        function defineFieldProperty(obj, key, ti_define_property_value) {
            var elementList = eval('obj.TiBindElementList.' + key);
            if (!elementList) {
                elementList = new Array();
                eval('obj.TiBindElementList.' + key + '= elementList');
            } else {
                return;
            }
            if (Ti.IsIE8) {
                eval('obj.ti_bind_object.' + key + '=value');
            }
            var value = ti_define_property_value;
            Object.defineProperty(obj, key, {
                get: function() {
                    return value;
                },
                set: function(val) {
                    var changed = value != val;
                    value = val;
                    if (Ti.IsIE8) {
                        eval('obj.ti_bind_object.' + key + '=value');
                    }
                    for (var i in elementList) {
                        var element = elementList[i];
                        if (element.ti_bind_object) {
                            if (element.ti_bind_value) {
                                var elementTagName = element.tagName.toLowerCase();
                                if (elementTagName === 'input' || elementTagName === 'textarea') {
                                    element.value = element.ti_bind_value(element.ti_bind_object);
                                } else if (elementTagName === 'select') {
                                    var selectValue = element.ti_bind_value(element.ti_bind_object);
                                    for (var j = 0; j < element.options.length; j++) {
                                        if (element.options[j].value == selectValue) {
                                            element.selectedIndex = j;
                                            element.options[j].selected = true;
                                        } else {
                                            element.options[j].selected = false;
                                        }
                                    }
                                } else {
                                    element.innerHTML = '';
                                    var ti_bind_temp = element.ti_bind_value(element.ti_bind_object);
                                    if (ti_bind_temp instanceof Element) {
                                        element.appendChild(ti_bind_temp);
                                    } else {
                                        element.innerText = ti_bind_temp;
                                    }
                                }
                            } else {
                                element.innerText = element.ti_bind_object[element.ti_bind_field];
                            }
                            if (changed && element.ti_bind_onchange) {
                                element.ti_bind_onchange(value, element.ti_bind_object);
                            }
                        }
                    }
                }
            });
        }

        function cloneObjectProperty(obj, key, value) {
            eval('obj.' + key + '=value');
            if (Ti.IsIE8) {
                eval('obj.ti_bind_object.' + key + '=value');
            }
        }

        function ti_bind_element_children(ti_bind_element) {
            var ti_bind_children = ti_bind_element.children;
            if (!ti_bind_children) {
                return;
            }
            for (var i = 0; i < ti_bind_children.length; i++) {
                if (!(ti_bind_children[i] instanceof Element) || !ti_bind_children[i].getAttribute) {
                    continue;
                }
                if (ti_bind_children[i].ti_bind_object) {
                    ti_bind_children[i].ti_bind_object = Ti.defineProperty(ti_bind_children[i].ti_bind_object, ti_bind_children[i].ti_bind_field);
                    ti_bind_children[i].ti_bind_object.bindElement(ti_bind_children[i], ti_bind_children[i].ti_bind_field);
                } else {
                    var ti_bind_attribute = ti_bind_children[i].getAttribute('t-load');
                    if (ti_bind_attribute) {
                        var loadObj = Titan.loadElement(ti_bind_children[i], ti_bind_attribute);
                        ti_bind_attribute = ti_bind_children[i].getAttribute('t-onload');
                        if (ti_bind_attribute) {
                            eval("loadObj.onload=" + ti_bind_attribute);
                        }
                        ti_bind_attribute = ti_bind_children[i].getAttribute('t-onunload');
                        if (ti_bind_attribute) {
                            eval("loadObj.onunload=" + ti_bind_attribute);
                        }
                        loadObj.load();
                        continue;
                    }
                    ti_bind_attribute = ti_bind_children[i].getAttribute('t-bind');
                    if (ti_bind_attribute) {
                        var split = ti_bind_attribute.split('.');
                        if (split.length > 0) {
                            ti_bind_attribute = split[0];
                            ti_bind_children[i].ti_bind_object_name = ti_bind_attribute;
                            if (split.length > 1) {
                                ti_bind_children[i].ti_bind_field = split[1];
                            } else {
                                ti_bind_children[i].ti_bind_field = ti_bind_children[i].getAttribute('id');
                            }
                            if (ti_bind_children[i].ti_bind_field && ti_bind_attribute) {
                                var ti_bind_object = eval(ti_bind_attribute);
                                eval(ti_bind_attribute + ' = Ti.defineProperty(ti_bind_object, ti_bind_children[i].ti_bind_field)');
                                eval(ti_bind_attribute).bindElement(ti_bind_children[i], ti_bind_children[i].ti_bind_field);
                            }
                        }
                        var ti_bind_onchange = ti_bind_children[i].getAttribute("t-changed");
                        if (ti_bind_onchange) {
                            eval('ti_bind_children[i].ti_bind_onchange = function (value,' + ti_bind_children[i].ti_bind_object_name + ') {' + ti_bind_onchange + '}');
                        }
                    }
                    var ti_bind_option_attr = ti_bind_children[i].getAttribute("t-option");
                    if (ti_bind_option_attr) {
                        var ti_bind_option_obj = eval(ti_bind_option_attr);
                        ti_bind_children[i].refreshOptions = function(options) {
                            if (options) {
                                if (this.childNodes) {
                                    var childs = this.childNodes;
                                    for (var j = childs.length - 1; j >= 0; j--) {
                                        this.removeChild(childs[j]);
                                    }
                                }
                                for (var k = 0; k < options.length; k++) {
                                    var ti_bind_option = document.createElement("option");
                                    ti_bind_option.value = options[k].value;
                                    ti_bind_option.innerText = options[k].name;
                                    if (ti_bind_option.value == this.ti_bind_value(this.ti_bind_object, this.ti_bind_field)) {
                                        ti_bind_option.setAttribute("selected", "selected");
                                    }
                                    this.appendChild(ti_bind_option);
                                }
                            }
                        }
                        ti_bind_children[i].refreshOptions(ti_bind_option_obj);
                    }
                    ti_bind_attribute = ti_bind_children[i].getAttribute('t-for'); {
                        //TODO...
                    }
                }
                ti_bind_element_children(ti_bind_children[i]);
            }
        };

        function findElementById(element, id) {
            var children = element.children;
            var result = null;
            for (var i = 0; i < children.length; i++) {
                if (children[i] instanceof Element) {
                    if (children[i].id && children[i].id === id) {
                        return children[i];
                    }
                }
                var result = findElementById(children[i], id);
                if (result)
                    return result;
            }
            return result;
        }

        function createTiObject(TiElement, url) {
            var result = {
                Element: TiElement,
                URL: url,
                TiChildObjects: new Array(),
                TiParentObject: null,
                element: function(elementId) {
                    return findElementById(this.Element, elementId);
                },

                load: function() {
                    if (this.Element) {
                        loadElementRes(this, url);
                    }
                },
                onload: function() {},
                onloadfailed: function() {},
                unload: function() {
                    for (var i = this.TiChildObjects.length - 1; i >= 0; i--) {
                        if (this.TiChildObjects[i].unload) {
                            this.TiChildObjects[i].unload();
                        }
                    }
                    if (this.TiChildObjects && this.TiChildObjects.length > 0) {
                        this.TiChildObjects.splice(0, this.TiChildObjects.length);
                    }
                    if (this.onunload) {
                        this.onunload();
                    }
                    this.TiParentObject
                    this.Element = null;
                    this.URL = null;
                    this.TiChildObjects = null;
                    this.TiParentObject = null;
                    this.element = null;
                    this.load = null;
                    this.unload = null;
                    this.onunload = null;
                    this.loadElement = null;
                    this.loadScript = null;
                    this.executeElement = null;
                },

                loadElement: function(element, url) {
                    if (!(element instanceof Element)) {
                        element = this.element(element);
                    }
                    if (!element) {
                        console.error("can't findElementById", elementId);
                        return null;
                    }
                    var obj = Titan.loadElement(element, url);
                    if (obj) {
                        obj.TiParentObject = this;
                        if (this.TiChildObjects)
                            this.TiChildObjects.push(obj);
                    }
                    return obj;
                },
                executeElement: function() {
                    this.Element.style.animation = "fade_in 0.24s forwards";
                    var TiElementScript = this.Element.getElementsByTagName("script");
                    if (this.Element && TiElementScript.length > 0) {
                        eval("this.loadScript = function(){" +
                            TiElementScript[0].innerHTML +
                            ";\r\n" +
                            ti_bind_element_children +
                            ";\r\n" +
                            "ti_bind_element_children(TiElement); this.onload();};");
                    }
                }
            }
            return result;
        }

        function loadElementRes(obj, url) {
            var rspData = null;
            if (Titan.version)
                rspData = Titan.loadLocalStorage(url);
            if (rspData) {
                obj.Element.innerHTML = rspData;
                obj.executeElement();
                if (obj.loadScript) {
                    setTimeout(function() {
                        if (obj.loadScript) {
                            obj.loadScript();
                        }
                    }, 1);
                }
            } else {
                Titan.loadRes({ url: url + Titan.pathTail }, function(status, rsp) {
                    if (status >= 200 && status < 300) {
                        if (Titan.version)
                            Titan.saveLocalStorage(url, rsp);
                        if (obj.Element) {
                            obj.Element.innerHTML = rsp;
                            obj.executeElement();
                            if (obj.loadScript) {
                                setTimeout(function() {
                                    if (obj.loadScript) {
                                        obj.loadScript();
                                    }
                                }, 1);
                            }
                        }
                    } else {
                        if (obj.Element) {
                            obj.Element.innerHTML = 'load failed...';
                        }
                        obj.onloadfailed();
                    }
                });
            }
        }
        Titan.loadElement = function(TiElement, url) {
            if (!(TiElement instanceof Element)) {
                TiElement = Titan.element(TiElement);
            }
            if (!TiElement) {
                return null;
            }
            if (TiElement.TiObject && TiElement.TiObject.unload) {
                TiElement.TiObject.unload();
            }
            TiElement.TiObject = createTiObject(TiElement, url);
            TiElement.style.animation = "";
            TiElement.innerHTML = "";
            return TiElement.TiObject;
        };

        Titan.defineProperty = function(ti_define_property_obj, ti_define_property_field, ti_bind_element) {
            var ti_define_property_obj_link = ti_define_property_obj;
            if (!ti_define_property_obj.TiBindElementList) {
                if (this.IsIE8) {
                    b = document.createElement('b');
                    b.ti_bind_object = {};
                    for (var i in ti_define_property_obj_link) {
                        var value = ti_define_property_obj_link[i];
                        cloneObjectProperty(b, i, value);
                    }
                    ti_define_property_obj = b;
                }
                ti_define_property_obj.TiBindElementList = {};
                Object.defineProperty(ti_define_property_obj, 'TiBindElementList', {
                    enumerable: false
                });
                ti_define_property_obj.bindElement = function(element, ti_bind_field) {
                    ti_define_property_obj.TiBindElementList[ti_bind_field].push(element);
                    if (!element.ti_bind_object) {
                        element.ti_bind_object = ti_define_property_obj;
                        element.ti_bind_object = ti_define_property_obj;
                        if (!element.ti_bind_field)
                            element.ti_bind_field = element.getAttribute("id");
                        var ti_bind_value = element.getAttribute("t-value");
                        if (ti_bind_value) {
                            eval('element.ti_bind_value = function (' + element.ti_bind_object_name + ') { return ' + ti_bind_value + '; }');
                        } else {
                            eval('element.ti_bind_value = function (' + element.ti_bind_object_name + ') { return ' + element.ti_bind_object_name + '.' + element.ti_bind_field + '; }');
                        }
                    }
                    eval('ti_define_property_obj.' + ti_bind_field + '=ti_define_property_obj.' + ti_bind_field);
                    var elementTagName = element.tagName.toLowerCase();
                    if (elementTagName === 'input' || elementTagName === 'textarea' || elementTagName === 'select') {
                        if (!element.ti_bind_save) {
                            var ti_bind_save = element.getAttribute("t-save");
                            if (ti_bind_save) {
                                eval('element.ti_bind_save = function (value,' + element.ti_bind_object_name + ') { ' + element.ti_bind_object_name + '.' + element.ti_bind_field + ' = ' + ti_bind_save + ';}');
                            } else {
                                eval('element.ti_bind_save = function (value,' + element.ti_bind_object_name + ') { ' + element.ti_bind_object_name + '.' + element.ti_bind_field + ' = value;}');
                            }
                        }
                        if (elementTagName === 'select') {
                            element.onchange = function(event) {
                                element.ti_bind_save(this.options[this.selectedIndex].value, element.ti_bind_object);
                            }
                        } else {
                            element.onchange = function(event) {
                                element.ti_bind_save(this.value, element.ti_bind_object);
                            }
                        }
                    }
                }
                Object.defineProperty(ti_define_property_obj, 'bindElement', {
                    enumerable: false
                });
            }
            if (ti_define_property_field)
                defineFieldProperty(ti_define_property_obj, ti_define_property_field, ti_define_property_obj_link[ti_define_property_field]);
            if (ti_bind_element)
                ti_define_property_obj.bindElement(ti_bind_element, ti_define_property_field);
            return ti_define_property_obj;
        };
        Titan.bindObject = function(obj, object_field, element, value, save, changed) {
            var arr = object_field.split(".");
            var name = arr[0];
            var field = arr[1];
            element.ti_bind_object = obj;
            element.ti_bind_object_name = name;
            element.ti_bind_field = field;
            if (value) {
                element.ti_bind_value = value;
            } else {
                eval('element.ti_bind_value = function (' + element.ti_bind_object_name + ') { return ' + element.ti_bind_object_name + '.' + element.ti_bind_field + '; }');
            }
            if (save) {
                element.ti_bind_save = save;
            }
            if (changed) {
                element.ti_bind_onchange = changed;
            }
            return this.defineProperty(obj, field, element);
        }
        Titan.nextElement = function(element) {
            if (element.nextElementSibling) {
                return element.nextElementSibling;
            }
            var n = element.nextSibling;
            while (n) {
                if (n.nodeType == 1) {
                    return n;
                }
                n = n.nextSibling;
            }
            return n;
        }
        Titan.setPathTail = function(tail) {
            Titan.pathTail = tail;
        };
        Titan.setMainFrame = function(elementId) {
            Titan.mainFrame = elementId;
        };
        Titan.setDefaultPage = function(url) {
            Titan.defaultPage = url;
        };
        Titan.location = window.location.hash;
        Titan.loadFrame = function(evt) {
            evt = {};
            evt.oldURL = Ti.location;
            Ti.location = window.location.hash;
            evt.newURL = Ti.location;
            var frame;
            var url = evt.newURL.replace("#", "");
            url = url.substr(0, url.indexOf('?') >= 0 ? url.indexOf('?') : url.length);
            if (url === '' || url === '/') {
                frame = Titan.loadElement(Titan.mainFrame, Titan.defaultPage);
                frame.load();
            } else {
                if (Titan.checkPermission) {
                    if (Titan.checkPermission(url)) {
                        frame = Titan.loadElement(Titan.mainFrame, url);
                        frame.load();
                    } else {
                        frame = Titan.loadElement(Titan.mainFrame, Titan.defaultPage);
                        frame.load();
                    }
                } else {
                    frame = Titan.loadElement(Titan.mainFrame, url);
                    frame.load();
                }
            }
            return frame;
        };
        Titan.getParam = function(name) {
            var url = window.location.href;
            if (url.indexOf("?") < 0)
                return null;
            url = url.substr(url.lastIndexOf('?') >= 0 ? url.lastIndexOf('?') + 1 : url.length, url.length);
            if (url.indexOf("&") >= 0) {
                var arr = url.split("&");
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].indexOf(name + "=") == 0) {
                        return arr[i].split("=")[1];
                    }
                }
            } else {
                if (url.indexOf(name + "=") == 0) {
                    return url.split("=")[1];
                }
            }
            return "";
        }
        return Titan;
    }
};
var Ti = Titanium.createNew();
window.onload = function() {
    if (document.body.clientHeight) {
        Ti.width = document.body.clientWidth;
        Ti.height = document.body.clientHeight;
    } else {
        Ti.width = document.documentElement.clientWidth;
        Ti.height = document.documentElement.clientHeight;
    }
    window.onhashchange = Ti.loadFrame;
    var version = Ti.loadLocalStorage('TiTaniumVersion');
    if (version !== Ti.version) {
        Ti.saveLocalStorage();
        Ti.saveLocalStorage('TiTaniumVersion', Ti.version);
    }
    Ti.init();
}
window.onresize = function() {
    Ti.width = document.documentElement.clientWidth;
    Ti.height = document.documentElement.clientHeight;
    if (Ti.width != Ti.lastWidth || Ti.height != Ti.lastHeight) {
        Ti.lastWidth = Ti.width;
        Ti.lastHeight = Ti.height;
        if (Ti.onresize) {
            Ti.onresize();
        }
    }
}