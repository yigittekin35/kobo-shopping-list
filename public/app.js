// Kobo Shopping List App - ES5 Compatible
(function() {
    'use strict';

    var app = {
        state: {
            items: [],
            recentItems: [],
            loading: true,
            error: null
        },

        init: function() {
            var refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
                    app.fetchItems();
                });
            }

            var addForm = document.getElementById('add-form');
            if (addForm) {
                addForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    app.addItem();
                });
            }

            var retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    app.fetchItems();
                });
            }

            app.fetchItems();
            app.fetchRecent();

            setInterval(function() {
                app.fetchItems(true);
                app.fetchRecent(true);
            }, 30000);
        },

        showError: function(message) {
            var errorContainer = document.getElementById('error-container');
            var errorMessage = document.getElementById('error-message');
            if (errorContainer && errorMessage) {
                errorMessage.innerText = message;
                errorContainer.className = 'error';
            }
        },

        hideError: function() {
            var errorContainer = document.getElementById('error-container');
            if (errorContainer) {
                errorContainer.className = 'error hidden';
            }
        },

        setLoading: function(isLoading, isBackground) {
            app.state.loading = isLoading;
            var loadingMessage = document.getElementById('loading-message');
            var listContainer = document.getElementById('list-container');
            var addForm = document.getElementById('add-form');

            if (isLoading && !isBackground) {
                if (loadingMessage) loadingMessage.className = 'loading';
                if (listContainer) listContainer.className = 'hidden';
                if (addForm) addForm.className = 'add-form hidden';
            } else if (!isLoading) {
                if (loadingMessage) loadingMessage.className = 'hidden';
                if (listContainer && app.state.items.length > 0) {
                    listContainer.className = '';
                } else if (listContainer) {
                    listContainer.className = 'hidden';
                }
                if (addForm) addForm.className = 'add-form';
            }
        },

        renderItems: function() {
            var unpurchasedList = document.getElementById('unpurchased-list');
            var purchasedList = document.getElementById('purchased-list');
            var listContainer = document.getElementById('list-container');

            if (!unpurchasedList || !purchasedList) return;

            unpurchasedList.innerHTML = '';
            purchasedList.innerHTML = '';

            if (app.state.items.length === 0) {
                if (listContainer) listContainer.className = 'hidden';
                return;
            }

            if (listContainer) listContainer.className = '';

            for (var i = 0; i < app.state.items.length; i++) {
                var item = app.state.items[i];
                var li = document.createElement('li');
                li.className = 'item' + (item.is_purchased ? ' purchased' : '');
                
                var statusText = item.is_purchased ? 'Purchased' : 'To Buy';
                
                var html = '<div class="item-header">' +
                    '<span class="item-name">' + app.escapeHtml(item.name) + '</span>' +
                    '<span class="item-status-label">' + statusText + '</span>' +
                    '</div>' +
                    '<div class="item-actions">' +
                    '<div class="quantity-controls">' +
                    '<button type="button" class="btn btn-border-right" onclick="window.app.updateItem(\'' + item.id + '\', \'decrement\')">-</button>' +
                    '<span class="quantity-display">' + item.quantity + '</span>' +
                    '<button type="button" class="btn btn-border-left" onclick="window.app.updateItem(\'' + item.id + '\', \'increment\')">+</button>' +
                    '</div>' +
                    '<button type="button" class="btn" onclick="window.app.updateItem(\'' + item.id + '\', \'toggle\')">' + (item.is_purchased ? 'Undo' : 'Mark Purchased') + '</button>' +
                    '<button type="button" class="btn" onclick="window.app.deleteItem(\'' + item.id + '\')">Delete</button>' +
                    '</div>';

                li.innerHTML = html;

                if (item.is_purchased) {
                    purchasedList.appendChild(li);
                } else {
                    unpurchasedList.appendChild(li);
                }
            }
        },

        escapeHtml: function(unsafe) {
            return (unsafe || '').toString()
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        },

        request: function(method, url, data, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 401) {
                        window.location.href = '/login.html';
                        return;
                    }
                    
                    var responseData = null;
                    try {
                        if (xhr.responseText) {
                            responseData = JSON.parse(xhr.responseText);
                        }
                    } catch(e) {
                        responseData = { error: 'Invalid response' };
                    }
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        callback(null, responseData);
                    } else {
                        callback(responseData && responseData.error ? responseData.error : 'An error occurred (' + xhr.status + ')', null);
                    }
                }
            };
            
            xhr.onerror = function() {
                callback('Network error. Please check your connection.', null);
            };
            
            if (data) {
                xhr.send(JSON.stringify(data));
            } else {
                xhr.send();
            }
        },

        fetchItems: function(isBackground) {
            if (!isBackground) app.setLoading(true, false);
            app.hideError();

            app.request('GET', '/api/items', null, function(err, data) {
                app.setLoading(false, isBackground);
                if (err) {
                    if (!isBackground) app.showError(err);
                } else {
                    app.state.items = data || [];
                    app.renderItems();
                }
            });
        },

        fetchRecent: function(isBackground) {
            app.request('GET', '/api/recent', null, function(err, data) {
                if (!err) {
                    app.state.recentItems = data || [];
                    app.renderRecent();
                }
            });
        },

        renderRecent: function() {
            var quickAddContainer = document.getElementById('quick-add-container');
            var quickAddList = document.getElementById('quick-add-list');
            
            if (!quickAddContainer || !quickAddList) return;
            
            quickAddList.innerHTML = '';
            
            if (app.state.recentItems.length === 0) {
                quickAddContainer.className = 'quick-add hidden';
                return;
            }
            
            quickAddContainer.className = 'quick-add';
            
            for (var i = 0; i < app.state.recentItems.length; i++) {
                var item = app.state.recentItems[i];
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quick-add-btn';
                btn.innerText = '+ ' + item.name;
                
                (function(itemName) {
                    btn.onclick = function() {
                        app.quickAdd(itemName);
                    };
                })(item.name);
                
                quickAddList.appendChild(btn);
            }
        },

        quickAdd: function(name) {
            app.hideError();
            app.setLoading(true, false);
            
            app.request('POST', '/api/items', { name: name, quantity: 1 }, function(err, data) {
                if (err) {
                    app.setLoading(false, false);
                    app.showError(err);
                } else {
                    app.fetchItems();
                    app.fetchRecent(true);
                }
            });
        },

        addItem: function() {
            var nameInput = document.getElementById('new-item-name');
            var qtyInput = document.querySelector('input[name="quantity"]');
            
            var name = nameInput ? nameInput.value : '';
            var quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;

            if (!name || name.trim() === '') {
                app.showError('Please enter a name.');
                return;
            }

            app.setLoading(true, false);
            app.hideError();

            app.request('POST', '/api/items', { name: name, quantity: quantity }, function(err, data) {
                if (err) {
                    app.setLoading(false, false);
                    app.showError(err);
                } else {
                    if (nameInput) nameInput.value = '';
                    if (qtyInput) qtyInput.value = '1';
                    app.fetchItems();
                    app.fetchRecent(true);
                }
            });
        },

        updateItem: function(id, action) {
            app.hideError();
            app.setLoading(true, false);
            
            app.request('PATCH', '/api/items', { id: id, action: action }, function(err, data) {
                if (err) {
                    app.setLoading(false, false);
                    app.showError(err);
                } else {
                    app.fetchItems();
                }
            });
        },

        deleteItem: function(id) {
            if (window.confirm && !window.confirm('Are you sure you want to delete this item?')) {
                return;
            }
            
            app.hideError();
            app.setLoading(true, false);
            
            app.request('DELETE', '/api/items', { id: id }, function(err, data) {
                if (err) {
                    app.setLoading(false, false);
                    app.showError(err);
                } else {
                    app.fetchItems();
                }
            });
        }
    };

    window.app = app;
})();
