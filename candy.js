/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Antoni Bertran <antoni@tresipunt.com>
 * Based on chatstates 
 * https://github.com/strophe/strophejs-plugins/blob/master/chatstates/strophe.chatstates.js  
 *
 * Copyright:
 *   (c) 2014 3&Punt Solucions Informàtiques Sl. All rights reserved.
 */
var CandyShop = (function(self) {
    return self;
}(CandyShop || {}));

/** Class: CandyShop.UserTyping
 * Send the notification when the user is typing
 */
CandyShop.UserTyping = (function(self, Candy, $) {
    /** Object: _options
     * Options:
     */
    var _options = {
    };

    var _connection = null;

    /**
     * 
     * @type Boolean
     */
    var _is_composing = false;



    /** Function: init
     * Initialize the ChatRecall plugin
     *
     * Parameters:
     *   (Object) options - An options packet to apply to this plugin
     */
    self.init = function(options) {
        // apply the supplied options to the defaults specified
        $.extend(true, _options, options);
        self.applyTranslations();
        $(Candy).on('candy:view.message.after-show', CandyShop.UserTyping.onKeyUp);
        Strophe.addConnectionPlugin('chatstates',
                {
                    init: function(connection)
                    {
                        this._connection = connection;
                        Strophe.addNamespace('CHATSTATES', 'http://jabber.org/protocol/chatstates');
                    },
                    statusChanged: function(status)
                    {
                        if (status === Strophe.Status.CONNECTED
                                || status === Strophe.Status.ATTACHED)
                        {
                            this._connection.addHandler(this._notificationReceived.bind(this),
                                    Strophe.NS.CHATSTATES, "message");
                        }
                    },
                    addActive: function(message)
                    {
                        return message.c('active', {xmlns: Strophe.NS.CHATSTATES}).up();
                    },
                    _notificationReceived: function(message)
                    {
                        var composing = $(message).find('composing'),
                                paused = $(message).find('paused'),
                        //        active = $(message).find('active'),
                       //         jid = $(message).attr('from')
                        current_user = $(message).attr('current_user');

                        if (composing.length > 0)
                        {
                            if (Candy.Core.getUser().getNick() !== current_user) {
                                CandyShop.UserTyping.showMessage(current_user + ' ' + $.i18n._('candyshopUserTypingUserIsTyping') + '...', true);
                            }
                        }

                        if (paused.length > 0)
                        {
                            CandyShop.UserTyping.showMessage('', false);
                        }

                        /*if (active.length > 0)
                        {
                            //  $(document).trigger('active.chatstates', jid);
                        }*/

                        return true;
                    },
                    /*sendActive: function(jid, type)
                    {
                        this._sendNotification(jid, type, 'active');
                    },*/
                    sendComposing: function(jid, type)
                    {
                        this._sendNotification(jid, type, 'composing');
                    },
                    sendPaused: function(jid, type)
                    {
                        this._sendNotification(jid, type, 'paused');
                    },
                    _sendNotification: function(jid, type, notification)
                    {
                        if (!type)
                            type = 'chat';

                        this._connection.send($msg(
                                {
                                    to: jid,
                                    type: type,
                                    current_user: Candy.Core.getUser().getNick()
                                })
                                .c(notification, {xmlns: Strophe.NS.CHATSTATES}));
                    }
                });

    }

    /**
     * Shows the message of user is typing
     * @param {type} message
     * @param {type} show_it
     * @returns {undefined}
     */
    self.showMessage = function(message, show_it) {
        var $messagePane = $(Candy.View.Pane.Room.getPane(Candy.View.getCurrent().roomJid));
        /*if (show_it) {
            if ($('.candy-usertyping-message-container:visible').length === 0) {
                $messagePane.prepend('<div class="candy-usertyping-message-container">' + message + '</div>');
                $messagePane.find('.message-pane-wrapper').addClass('candy-has-usertyping-message');
            } else {
                $messagePane.find('.candy-usertyping-message-container').html(message);
            }
            $messagePane.find('.candy-usertyping-message-container').show();
        } else {
            $messagePane.find('.candy-usertyping-message-container').hide();
        }*/
        $messagePane.find('.candy-usertyping-message-container').hide();
        $messagePane.find('.candy-usertyping-message-container').remove();
        
        if (show_it) {
            var html = '<li class="candy-usertyping-message-container"><div class="infomessage">' + message + '</div></li>';
            Candy.View.Pane.Room.appendToMessagePane(Candy.View.getCurrent().roomJid, html);
            Candy.View.Pane.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
        }

    }

    /**
     * Triggers the event on key up
     * @returns {undefined}
     */
    self.onKeyUp = function() {
        $(".field[name='message']").keyup(function(e) {
            if (e.which === 13 || $(".field[name='message']").val().length===0) {
                if (_is_composing) {
                    _is_composing = false;
                    Candy.Core.getConnection().chatstates.sendPaused(Candy.View.getCurrent().roomJid, 'groupchat');
                }
            } else {
                if (!_is_composing) {
                    _is_composing = true;
                    Candy.Core.getConnection().chatstates.sendComposing(Candy.View.getCurrent().roomJid, 'groupchat');
                    setTimeout(CandyShop.UserTyping.disableComposing, 5000);
                }
            }
        });
    }

    /**
     * Disable the composing message after 5 seconds
     * @returns {undefined}
     */
    self.disableComposing = function() {
        _is_composing = false;
        CandyShop.UserTyping.showMessage('', false);
    }

    /** Function: applyTranslations
     * Apply translations to this plugin
     */
    self.applyTranslations = function() {
        Candy.View.Translation.en.candyshopUserTypingUserIsTyping = 'is typing';
        Candy.View.Translation.es.candyshopUserTypingUserIsTyping = 'está escribiendo';
        Candy.View.Translation.ca.candyshopUserTypingUserIsTyping = 'està escribint';
    };


    return self;
}(CandyShop.UserTyping || {}, Candy, jQuery));