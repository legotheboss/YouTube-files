#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h> 
#include <ArduinoJson.h>
#include <Wire.h>  
#include <SSD1306.h>

/**
 * YouTubeOLED.ino
 *  
 *  A simple sketch that fetches and displays
 *  a specific YouTube channel's statistics
 *  on a SSD1306 display over I2C
 *  
 *  Created on: 16.04.2017
 *  Created by: Amruth Pabba aka QuickPi
 */
 
String channelID = "UC3AGxC2YOkov8pIchTHRqQw"; //The channel ID of the youtube channel you wish to pull the data of
String channelName ="QuickPi"; //Desired YouTube channel name
const int sleepTimeS = 10; //how often you want the data to be refreshed
SSD1306  display(0x3c, 4, 5); //the display I2C address, SCL and SDA pins

WiFiManager wifiManager;
String payload = "";
String subsM = "";
String viewsM = ""; 

void setup() {
  pinMode(BUILTIN_LED, OUTPUT); 
  digitalWrite(BUILTIN_LED, HIGH); 
  display.init();
  display.flipScreenVertically();
  display.setFont(ArialMT_Plain_24);
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  display.clear();
  display.drawString(0, 19, "Booting...");
  display.display();
  delay(250);
  display.clear();
  display.drawString(0, 6, "Searching");
  display.drawString(0, 32, "Wi-Fi");
  display.display();
  display.clear();
  if(wifiManager.autoConnect("YouTube OLED")){
    Serial.println("Wi-Fi Connected");
    display.drawString(0, 6, "Wi-Fi");
    display.drawString(0, 32, "Connected");
    display.display();
    delay(500);
  }
  if(!wifiManager.autoConnect("YouTube OLED")){
    display.clear();
    display.drawString(0, 6, "Retrying");
    display.drawString(0, 32, "Wi-Fi");
    delay(5000);
    ESP.reset();
  }
}

void loop() 
{  
  DynamicJsonBuffer jsonBuffer;
  HTTPClient http;
  Serial.println("[HTTP] begin...\n");
  display.clear();
  Serial.println("Getting Data");
  display.drawString(0, 6, "Getting");
  display.drawString(0, 32, "Data");
  display.display();
  delay(500);
  http.begin("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'https%3A%2F%2Fwww.youtube.com%2Fchannel%2F"+channelID+"%2Fabout'%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22browse-items-primary%22%5D%2Fli%2Fdiv%2Fdiv%5B3%5D%2Fdiv'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"); //HTTP
  Serial.println("[HTTP] GET...\n");
  int httpCode = http.GET();
  Serial.printf("[HTTP] GET... code: %d\n", httpCode);
  payload = http.getString();
  JsonObject& root = jsonBuffer.parseObject(payload);
  String subs = root["query"]["results"]["div"]["span"][0]["b"];
  subsM = subs;
  String views = root["query"]["results"]["div"]["span"][1]["b"];
  viewsM = views;
  display.clear();
  Serial.println("Parsed Data");
  display.drawString(0, 6, "Parsed");
  display.drawString(0, 32, "Data");
  display.display();
  delay(500); 
  http.end();
  Serial.println("S:"+subsM);
  Serial.println("V:"+viewsM);
  display.clear();
  display.setFont(ArialMT_Plain_24);
  display.drawString(0, 2, "S:"+subsM);
  display.drawString(0, 28, "V:"+ viewsM);
  display.setFont(ArialMT_Plain_10);
  display.drawString(0, 52, channelName + " Stats");
  display.display();
  digitalWrite(BUILTIN_LED, LOW); 
  ESP.deepSleep(sleepTimeS * 1000000);
}
