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
                
                var cbContainer = document.createElement('div');
                cbContainer.className = 'checkbox-container';
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'item-checkbox';
                checkbox.checked = item.is_purchased;
                
                (function(itemId, isPurchased) {
                    checkbox.addEventListener('change', function() {
                        app.toggleItem(itemId, isPurchased);
                    });
                })(item.id, item.is_purchased);
                
                cbContainer.appendChild(checkbox);
                
                var nameSpan = document.createElement('span');
                nameSpan.className = 'item-name' + (item.is_purchased ? ' purchased' : '');
                nameSpan.innerText = item.name;
                
                cbContainer.appendChild(nameSpan);
                li.appendChild(cbContainer);
                
                var actionsDiv = document.createElement('div');
                actionsDiv.className = 'item-actions';
                
                var deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'btn delete-btn';
                deleteBtn.innerText = 'Sil';
                
                (function(itemId) {
                    deleteBtn.addEventListener('click', function() {
                        app.deleteItem(itemId);
                    });
                })(item.id);
                
                actionsDiv.appendChild(deleteBtn);
                li.appendChild(actionsDiv);

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
            
            app.request('POST', '/api/items', { name: name, quantity: 1 }, function(err, data) {
                if (err) {
                    app.showError(err);
                } else {
                    app.fetchItems(true);
                    app.fetchRecent(true);
                }
            });
        },

        addItem: function() {
            var nameInput = document.getElementById('new-item-name');
            var name = nameInput ? nameInput.value.trim() : '';

            if (!name) return;

            app.hideError();

            app.request('POST', '/api/items', { name: name, quantity: 1 }, function(err, data) {
                if (err) {
                    app.showError(err);
                } else {
                    if (nameInput) nameInput.value = '';
                    app.fetchItems(true);
                    app.fetchRecent(true);
                }
            });
        },

        toggleItem: function(id, isPurchased) {
            app.hideError();
            
            for (var i = 0; i < app.state.items.length; i++) {
                if (app.state.items[i].id === id) {
                    app.state.items[i].is_purchased = !isPurchased;
                    break;
                }
            }
            app.renderItems();
            
            var action = isPurchased ? 'unpurchase' : 'purchase';
            app.request('PATCH', '/api/items', { id: id, action: action }, function(err, data) {
                if (err) {
                    app.showError(err);
                    app.fetchItems(true);
                } else {
                    app.fetchItems(true);
                }
            });
        },

        deleteItem: function(id) {
            app.hideError();
            
            var newItems = [];
            for (var i = 0; i < app.state.items.length; i++) {
                if (app.state.items[i].id !== id) {
                    newItems.push(app.state.items[i]);
                }
            }
            app.state.items = newItems;
            app.renderItems();
            
            app.request('DELETE', '/api/items', { id: id }, function(err, data) {
                if (err) {
                    app.showError(err);
                    app.fetchItems(true);
                } else {
                    app.fetchItems(true);
                }
            });
        }
    };

    window.app = app;
})();
