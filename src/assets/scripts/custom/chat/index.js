import * as Twilio from 'twilio-chat/dist/twilio-chat.min.js';
import * as ui from '../ui';
import * as api from '../api';
import * as storage from '../storage';
import * as tools from '../tools';

// API: Token, chat identity, chat client
let token,
    identity,
    chatClient;

// Authenticate user session
export function authenticatedCheck() {
    return api.isAuthenticated()
    .then((r) => {
        if (!r) tools.load('signin.html');
    });
}

// API: Chat API Functions

export function getChannel(sid) {
    return chatClient.getChannelBySid(sid);
}

export function getUser(username) {
    return chatClient.getUser(username);
}

function setUsername() {
    return storage.get('login')
    .then(JSON.parse)
    .then((u) => {
        identity = `artist-${u.username}`;
        return identity;
    });
}

function clientInit() {
    return Twilio.Client.create(token, { logLevel: 'warn' })
    .then((client) => {
        chatClient = client;
        return chatClient;
    });
}

export function pushSub(pushId) {
    return chatClient.setPushRegistrationId('fcm', pushId);
}

function getUserRooms() {
    return chatClient.getSubscribedChannels();
}

// Get Chat API Token
export function init() {
    return api.getChatToken()
    // Save and log token
    .then((d) => { token = d; })
    // Set and log identity
    .then(setUsername)
    .then(clientInit);
}

export function createChannel(name, readableName, attributes, privateChat = true) {
    return chatClient.createChannel({
        uniqueName: name,
        friendlyName: readableName,
        isPrivate: privateChat,
        attributes,
    })
    .then((channel) => {
        // Cache channel
        const cache = channel.state;
        cache.sid = channel.sid;
        storage.save(`channel-${cache.sid}`, JSON.stringify(cache));
        return channel;
    });
}

export function listChannels() {
    // Get all subscribed rooms
    return getUserRooms()
    .then((channels) => {
        // Create progress array
        const progress = [];

        // Loop each room found
        channels.items.forEach((channel) => {
            // Cache channel
            const cache = channel.state;
            cache.sid = channel.sid;
            storage.save(`channel-${cache.sid}`, JSON.stringify(cache));

            // Print event to list
            progress.push(ui.printChannel(channel));
        });

        // Handle event hover
        return Promise.all(progress);
    });
}

export function tokenListener() {
    chatClient.on('tokenAboutToExpire', init);
}

export function chatListeners() {
    chatClient.on('channelAdded', listChannels);
    chatClient.on('channelLeft', (channel) => {
        console.log(channel);
        $(`[data-role="channel"][data-sid="${channel.sid}"]`).remove();
        ($('[data-role="chat-message-view"]').data('sid') === channel.sid) ? ui.selectFirstChat() : null;
    });
    chatClient.on('channelRemoved', (channel) => {
        console.log(channel);
        $(`[data-role="channel"][data-sid="${channel.sid}"]`).remove();
        ($('[data-role="chat-message-view"]').data('sid') === channel.sid) ? ui.selectFirstChat() : null;
    });
}
