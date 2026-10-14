import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const terms = [
  "1. NEFT/RTGS should be initiated by using customer to customer bank account transfer [R41 mode only]. In case you are requesting your bank branch to initiate NEFT/RTGS on your behalf, it must be specifically using R41 mode only. Using any other mode for transfer of funds will be treated as invalid and required services will not be rendered.",
  "2. NEFT/RTGS transfer amount should be an exact match with transaction amount mentioned on this slip (including paisa). Moreover, higher amount can be transferred.",
  "3. Do not round off the transfer amount on lower side, even for the second decimal. Any transaction lower than this challan amount will be automatically rejected.",
  "4. The sender will not initiate multiple NEFT/RTGS by breaking the amount in more than one part. Such EFTs will be treated as invalid transactions and required service will not be delivered.",
  "5. NEFT/RTGS should be initiated from the sender's bank account as any refund/reversal will be credited in the same bank account.",
  "6. It is sender's responsibility to ensure that the bank account is enabled for incoming NEFT/RTGS.",
  "7. A nominal amount may be charged to the sender towards refund processing for invalid transactions / Refunds.",
  "8. This Challan is valid for 3 days only. Any payment made after 3 days will be automatically Rejected.",
  "9. Transaction are allowed only through RTGS/NEFT.",
  "10. This challan is meant for one time transaction/ uses only. The consumers are advised to download fresh challan for every transaction. Any subsequent NEFT/ RTGS transactions using the details of this challan will automatically liable to be rejected without any claim on DHBVN.",
  '11. the fifth Character of this IFSC code is “0”( Numeric ZERO).',
];

const s = StyleSheet.create({
  page: { paddingTop: 10, paddingBottom: 10, paddingHorizontal: 12, fontFamily: "Helvetica", color: "#000", backgroundColor: "#fff" },
  receipt: { borderWidth: 0.7, borderColor: "#555" },
  row: { flexDirection: "row", minHeight: 15, borderBottomWidth: 0.55, borderBottomColor: "#555" },
  cell: { justifyContent: "center", paddingHorizontal: 3, paddingVertical: 1, borderRightWidth: 0.55, borderRightColor: "#555" },
  label: { width: "20%", fontSize: 8, fontWeight: "bold" },
  value: { width: "22%", fontSize: 8 },
  labelRight: { width: "25%", fontSize: 8, fontWeight: "bold" },
  valueRight: { width: "33%", fontSize: 8, borderRightWidth: 0 },
  headerRow: { flexDirection: "row", minHeight: 38, borderBottomWidth: 0.55, borderBottomColor: "#555" },
  logo: { width: "20%", alignItems: "center", justifyContent: "center", borderRightWidth: 0.55, borderRightColor: "#555" },
  logoText: { fontSize: 17, fontWeight: "bold", color: "#253d91" },
  heading: { flex: 1, alignItems: "center", justifyContent: "center" },
  headingText: { fontSize: 10, fontWeight: "bold", textAlign: "center", lineHeight: 11 },
  section: { minHeight: 13, justifyContent: "center", alignItems: "center", borderBottomWidth: 0.55, borderBottomColor: "#555" },
  sectionText: { fontSize: 8.5, fontWeight: "bold", textAlign: "center" },
  beneficiaryRow: { flexDirection: "row", minHeight: 13, borderBottomWidth: 0.55, borderBottomColor: "#555" },
  beneficiaryLabel: { width: "25%", alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 3, borderRightWidth: 0.55, borderRightColor: "#555" },
  beneficiaryValue: { width: "75%", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  term: { fontSize: 8.8, lineHeight: 10, paddingHorizontal: 3, paddingVertical: 1, borderBottomWidth: 0.45, borderBottomColor: "#777" },
});

function DetailRow({ leftLabel, leftValue, rightLabel, rightValue }: {
  leftLabel: string; leftValue: string; rightLabel: string; rightValue: string;
}) {
  return <View style={s.row}>
    <View style={[s.cell, s.label]}><Text>{leftLabel}</Text></View>
    <View style={[s.cell, s.value]}><Text>{leftValue}</Text></View>
    <View style={[s.cell, s.labelRight]}><Text>{rightLabel}</Text></View>
    <View style={[s.cell, s.valueRight]}><Text>{rightValue}</Text></View>
  </View>;
}

export default function DhbvnReceipt() {
  const beneficiary = [
    ["Beneficiary Name:", "Dakshin Haryana Bijli Vitran Nigam-Online"],
    ["Beneficiary A/C No:", "ZDHBVN147791085"],
    ["Beneficiary IFSC:", "YESB0CMSNOC"],
    ["Amount:", "6236"],
  ];
  return <Document title="DHBVN NEFT RTGS Challan">
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.receipt}>
        <View style={s.headerRow}>
          <View style={s.logo}>
            {/* Replace this placeholder with your existing logo/icon */}
            <Text style={s.logoText}>DHBVN</Text>
          </View>
          <View style={s.heading}>
            <Text style={s.headingText}>Dakshin Haryana Bijli Vitran Nigam{"\n"}Vidyut Sadan, Vidyut Nagar, Hisar -125005{"\n"}Haryana, India</Text>
          </View>
        </View>
        <DetailRow leftLabel="Account No" leftValue="7283920000" rightLabel="Consumer Name" rightValue="RAM SINGH\\AAD RAM" />
        <DetailRow leftLabel="Reference ID" leftValue="147791085" rightLabel="Reference Date" rightValue="13/10/2026" />
        <DetailRow leftLabel="Pay-Option:" leftValue="Online EFT" rightLabel="Amount" rightValue="6236" />
        <View style={s.section}><Text style={s.sectionText}>NEFT/RTGS Details</Text></View>
        {beneficiary.map(([label, value]) => <View key={label} style={s.beneficiaryRow}>
          <View style={s.beneficiaryLabel}><Text style={{ fontSize: 8, fontWeight: "bold" }}>{label}</Text></View>
          <View style={s.beneficiaryValue}><Text style={{ fontSize: 8 }}>{value}</Text></View>
        </View>)}
        <View style={s.section}><Text style={s.sectionText}>I/We (sender) have read, understood and accepted the following terms &amp; conditions:</Text></View>
        {terms.map((term, i) => <Text key={i} style={s.term}>{term}</Text>)}
      </View>
    </Page>
  </Document>;
}
