# OpenLedger ProGuard Rules
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keep class org.kovina.ledger.** { *; }
-dontwarn org.kovina.ledger.**
