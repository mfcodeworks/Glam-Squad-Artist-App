/* eslint-disable no-warning-comments */
import * as ui from './ui-tools';
import * as api from './api';
import * as Twilio from 'twilio-chat';
import * as storage from './storage';
import * as tools from './tools';

/** 
 * API: Chat Global Variables
 */

// API Token
var token;
// Chat Identity
var identity;
// Chat Client (Twilio communication)
var chatClient;

// Authenticate user session
export function authenticatedCheck() {
    return api.isAuthenticated()
        .then(function(r) {
            if(!r) tools.load("login.html");
        });
}

// API: Chat API Functions

/** 
 * TODO: 
 * - On channelAdded print channel
 * - On channelRemoved delete div[data-sid="sid"]
 */

// Get Chat API Token
export function init() {
    return api.getChatToken()
    .then(function(d) {
        // Save and log token
        token = d;
        console.log(token);
    })
    // Set and log identity
    .then(setUsername)
    .then(clientInit)
    .finally(console.log);
}

export function createChannel(name, readableName, attributes, privateChat = true) {
    return chatClient.createChannel({
        uniqueName: name,
        friendlyName: readableName,
        isPrivate: privateChat,
        attributes: attributes
    })
    .then(function(channel) {
        // Cache channel
        var cache = channel.state;
        cache.sid = channel.sid;
        storage.save(`channel-${cache.sid}`, JSON.stringify(cache));
        return channel;
    })
}

export function listChannels() {
    // Get all subscribed rooms
    return getUserRooms()
    .then(function(channels) {
        // Log rooms
        console.log(channels);

        // Create progress array
        var progress = [];

        // Loop each room found
        channels.items.forEach(function(channel) {
            // Cache channel
            var cache = channel.state;
            cache.sid = channel.sid;
            storage.save(`channel-${cache.sid}`, JSON.stringify(cache));

            // Print event to list
            progress.push(ui.printChannel(channel));
        });

        // Handle event hover 
        return Promise.all(progress)
    });
}

export function getChannel(sid) {
    return chatClient.getChannelBySid(sid);
}

export function getUser(username) {
    return chatClient.getUser(username);
}

function setUsername() {
    return storage.get("login")
        .then(JSON.parse)
        .then(function(u) {
            identity = `artist-${u.username}`;
            return identity;
        });
}

function clientInit() {
    return Twilio.Client.create(token, {logLevel: "debug"})
    .then(function (client) {
        chatClient = client;
        return chatClient;
    });
}

export function pushSub(pushId) {
    return chatClient.setPushRegistrationId("fcm", pushId);
}

export function expiryHandler() {
    chatClient.on("tokenExpired", init);
}

function getUserRooms() {
    return chatClient.getSubscribedChannels();
}