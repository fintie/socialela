# About

This is a basic sample / quickstart application for **Elastos Trinity**. 

It's based on a simple ionic HTML5 tab application, but it also contains a default manifest file ready and is therefore 
ready to be packaged as a EPK file (Elastos Trinity package format), and ran inside the Trinity application (you have to 
install that application first on your mobile device).

Read more on [the Elastos developer website](https://developer.elastos.org) to learn more about building and running 
your own Trinity applications.

# node_modules fix

IN

\node_modules\ionic-angular\components\app\app.js

Replace

import { DOCUMENT, Title } from '@angular/platform-browser';
with

import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
And IN

\node_modules\ionic-angular\module.js

Replace

import { DOCUMENT, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
With

import { DOCUMENT } from '@angular/common';
import { HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';