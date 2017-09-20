(function($, window, undefined) {
    "use strict";
    if (typeof($.signalR) !== "function") {
        throw new Error("SignalR: SignalR is not loaded. Please ensure jquery.signalR-x.js is referenced before ~/signalr/js.");
    }
    var signalR = $.signalR;

    function makeProxyCallback(hub, callback) {
        console.log("makeProxyCallback")
        return function() {
            callback.apply(hub, $.makeArray(arguments));
        };
    }

    function registerHubProxies(instance, shouldSubscribe) {
        console.log("registerHubProxies")
        var key, hub, memberKey, memberValue, subscriptionMethod;
        for (key in instance) {
            if (instance.hasOwnProperty(key)) {
                hub = instance[key];
                if (!(hub.hubName)) {
                    continue;
                }
                if (shouldSubscribe) {
                    subscriptionMethod = hub.on;
                } else {
                    subscriptionMethod = hub.off;
                }
                for (memberKey in hub.client) {
                    if (hub.client.hasOwnProperty(memberKey)) {
                        memberValue = hub.client[memberKey];
                        if (!$.isFunction(memberValue)) {
                            continue;
                        }
                        subscriptionMethod.call(hub, memberKey, makeProxyCallback(hub, memberValue));
                    }
                }
            }
        }
    }
    $.hubConnection.prototype.createHubProxies = function() {
        console.log("$.hubConnection.prototype.createHubProxies")
        var proxies = {};
        this.starting(function() {
            registerHubProxies(proxies, true);
            this._registerSubscribedHubs();
        }).disconnected(function() {
            registerHubProxies(proxies, false);
        });
        proxies['coreHub'] = this.createHubProxy('coreHub');
        proxies['coreHub'].client = {};
        proxies['coreHub'].server = {
            queryBalanceState: function() {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["QueryBalanceState"], $.makeArray(arguments)));
            },
            queryExchangeState: function(marketName) {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["QueryExchangeState"], $.makeArray(arguments)));
            },
            queryOrderState: function(marketName) {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["QueryOrderState"], $.makeArray(arguments)));
            },
            querySummaryState: function() {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["QuerySummaryState"], $.makeArray(arguments)));
            },
            subscribeToExchangeDeltas: function(marketName) {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["SubscribeToExchangeDeltas"], $.makeArray(arguments)));
            },
            subscribeToUserDeltas: function() {
                return proxies['coreHub'].invoke.apply(proxies['coreHub'], $.merge(["SubscribeToUserDeltas"], $.makeArray(arguments)));
            }
        };
        return proxies;
    };
    signalR.hub = $.hubConnection("/signalr", {
        useDefaultPath: false
    });
    $.extend(signalR, signalR.hub.createHubProxies());
}(window.jQuery, window));