#include <WiFi.h>
#include <HTTPClient.h>

// ====== WIFI ======
const char* ssid = "main";
const char* password = "12345678";

// ====== FIREBASE ======
const char* firebaseURL = "https://smart-blindsystem-default-rtdb.firebaseio.com/sensor/current.json";

// ====== PINS ======
#define TRIG_PIN 5
#define ECHO_PIN 18

// ====== CONFIG ======
#define SEND_INTERVAL 200   // ms (safe range: 500–1000)

unsigned long lastSend = 0;

// ====== DISTANCE FUNCTION ======
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout

  if (duration == 0) return -1; // invalid

  float distance = duration * 0.034 / 2;

  if (distance <= 0 || distance > 400) return -1;

  return distance;
}

// ====== SEND TO FIREBASE ======
void sendToFirebase(float distance) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(firebaseURL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"distance\":" + String(distance, 1) + "}";

  int code = http.PUT(payload);

  Serial.print("HTTP: ");
  Serial.println(code);

  http.end();
}

// ====== SETUP ======
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  WiFi.begin(ssid, password);

  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");
}

// ====== LOOP ======
void loop() {
  float distance = getDistance();

  Serial.print("Distance: ");
  Serial.println(distance);

  if (millis() - lastSend >= SEND_INTERVAL) {
    sendToFirebase(distance);
    lastSend = millis();
  }

  delay(100);
}