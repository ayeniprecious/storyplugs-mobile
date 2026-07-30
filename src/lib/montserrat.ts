// Custom fonts loaded via expo-font are fixed-weight -- setting a numeric
// fontWeight in a style has no effect once fontFamily points at one of
// these (each weight is its own distinct font, loaded separately in
// app/_layout.tsx's useFonts call). This maps whatever fontWeight a style
// already asks for onto the matching loaded Montserrat family, so the
// app-wide Montserrat switch doesn't flatten every heading/label back to
// one visual weight.
const WEIGHT_TO_FAMILY: Record<string, string> = {
  "400": "Montserrat_400Regular",
  normal: "Montserrat_400Regular",
  "500": "Montserrat_500Medium",
  "600": "Montserrat_600SemiBold",
  "700": "Montserrat_700Bold",
  bold: "Montserrat_700Bold",
  "800": "Montserrat_800ExtraBold",
  "900": "Montserrat_800ExtraBold",
};

export function resolveMontserrat(fontWeight: number | string | undefined): string {
  if (fontWeight === undefined) return "Montserrat_400Regular";
  return WEIGHT_TO_FAMILY[String(fontWeight)] ?? "Montserrat_400Regular";
}
