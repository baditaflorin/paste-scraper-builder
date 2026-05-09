import type { FieldRule, ScraperProject, SelectorMode } from './types'

const appVersion = typeof __APP_VERSION__ === 'undefined' ? 'test' : __APP_VERSION__

const stringLiteral = (value: string): string => JSON.stringify(value)

const modeLiteral = (mode: SelectorMode): string => stringLiteral(mode)

const pythonFieldList = (fields: FieldRule[]): string =>
  fields
    .map(
      (field) =>
        `{ "name": ${stringLiteral(field.name)}, "selector": ${stringLiteral(field.selector)}, "mode": ${modeLiteral(
          field.selectorMode,
        )}, "attribute": ${stringLiteral(field.attribute)}, "type": ${stringLiteral(field.fieldType ?? 'text')}, "confidence": ${
          field.confidence ?? 0
        }, "scope": ${stringLiteral(field.scope ?? 'row')}, "multi": ${field.multi ? 'True' : 'False'}, "normalizer": ${stringLiteral(
          field.normalizer ?? '',
        )} }`,
    )
    .join(',\n    ')

export const generatePythonScraper = (project: ScraperProject): string => `from pathlib import Path
from parsel import Selector
import re

# pip install parsel
HTML_PATH = "page.html"
APP_VERSION = ${stringLiteral(appVersion)}
SCHEMA_VERSION = ${stringLiteral(project.schemaVersion ?? '2.0.0')}
SOURCE_URL = ${stringLiteral(project.sourceUrl ?? '')}
INFERRED_SHAPE = ${stringLiteral(project.inferredShape ?? 'manual')}
INFERENCE_CONFIDENCE = ${project.inferenceConfidence ?? 0}
ROW_SELECTOR = ${stringLiteral(project.rowSelector)}
ROW_MODE = ${modeLiteral(project.rowSelectorMode)}
FIELDS = [
    ${pythonFieldList(project.fields)}
]

def select(context, selector, mode):
    if selector == ".":
        return [context]
    if mode == "css":
        return context.css(selector)
    return context.xpath(selector)

def clean(value):
    return " ".join((value or "").split())

def normalize(value, field):
    text = clean(value)
    normalizer = field.get("normalizer") or field.get("type")
    if normalizer in ("price",):
        amount = re.search(r"-?\\d[\\d,.]*", text)
        if not amount:
            return text
        prefix = {"£": "GBP", "$": "USD", "€": "EUR"}.get(text[:1], "")
        return f"{prefix + ' ' if prefix else ''}{amount.group(0).replace(',', '')}"
    if normalizer in ("number", "count", "comments"):
        amount = re.search(r"-?\\d[\\d,.]*", text)
        return amount.group(0).replace(",", "") if amount else ""
    if normalizer == "githubOwner":
        return "".join(text.split()).split("/")[0]
    if normalizer == "githubRepo":
        parts = "".join(text.split()).split("/")
        return parts[1] if len(parts) > 1 else text
    if normalizer == "arxivId":
        match = re.search(r"arXiv:\\s*(\\S+)", text, re.I)
        return match.group(1) if match else text
    if normalizer == "list":
        return "; ".join([part.strip() for part in re.split(r"\\s*;\\s*|\\s*,\\s*", text) if part.strip()])
    return text

def extract_value(selection, attribute):
    if not selection:
        return ""
    node = selection[0]
    if attribute == "text":
        return clean(node.xpath("string(.)").get())
    if attribute == "html":
        return node.get() or ""
    return clean(node.attrib.get(attribute, ""))

root = Selector(text=Path(HTML_PATH).read_text(encoding="utf-8"))
rows = root.css(ROW_SELECTOR) if ROW_MODE == "css" else root.xpath(ROW_SELECTOR)
records = []

for index, row in enumerate(rows):
    record = {}
    for field in FIELDS:
        context = row
        if field["scope"] == "nextSibling" and index + 1 < len(rows):
            context = rows[index + 1]
        selections = select(context, field["selector"], field["mode"])
        if field["multi"]:
            record[field["name"]] = normalize("; ".join(extract_value([item], field["attribute"]) for item in selections), field)
        else:
            record[field["name"]] = normalize(extract_value(selections, field["attribute"]), field)
        record[f'{field["name"]}__confidence'] = field["confidence"]
        record[f'{field["name"]}__type'] = field["type"]
    record["_psb_app_version"] = APP_VERSION
    record["_psb_schema_version"] = SCHEMA_VERSION
    record["_psb_shape"] = INFERRED_SHAPE
    record["_psb_source_url"] = SOURCE_URL
    records.append(record)

print(records)
`

const goFieldList = (fields: FieldRule[]): string =>
  fields
    .map(
      (field) =>
        `{Name: ${stringLiteral(field.name)}, Selector: ${stringLiteral(field.selector)}, Mode: ${modeLiteral(
          field.selectorMode,
        )}, Attribute: ${stringLiteral(field.attribute)}, Type: ${stringLiteral(field.fieldType ?? 'text')}, Confidence: ${
          field.confidence ?? 0
        }, Scope: ${stringLiteral(field.scope ?? 'row')}, Multi: ${field.multi ? 'true' : 'false'}, Normalizer: ${stringLiteral(
          field.normalizer ?? '',
        )}}`,
    )
    .join(',\n\t')

export const generateGoScraper = (project: ScraperProject): string => `package main

import (
\t"bytes"
\t"encoding/csv"
\t"fmt"
\t"os"
\t"regexp"
\t"strings"

\t"github.com/andybalholm/cascadia"
\t"github.com/antchfx/htmlquery"
\t"golang.org/x/net/html"
)

type Field struct {
\tName      string
\tSelector  string
\tMode      string
\tAttribute string
\tType      string
\tConfidence float64
\tScope     string
\tMulti     bool
\tNormalizer string
}

const appVersion = ${stringLiteral(appVersion)}
const schemaVersion = ${stringLiteral(project.schemaVersion ?? '2.0.0')}
const sourceURL = ${stringLiteral(project.sourceUrl ?? '')}
const inferredShape = ${stringLiteral(project.inferredShape ?? 'manual')}

var fields = []Field{
\t${goFieldList(project.fields)},
}

func clean(value string) string {
\treturn strings.Join(strings.Fields(value), " ")
}

func selectNodes(node *html.Node, selector string, mode string) []*html.Node {
\tif selector == "." {
\t\treturn []*html.Node{node}
\t}
\tif mode == "xpath" {
\t\treturn htmlquery.Find(node, selector)
\t}
\tmatcher, err := cascadia.Compile(selector)
\tif err != nil {
\t\treturn nil
\t}
\treturn cascadia.QueryAll(node, matcher)
}

func renderHTML(node *html.Node) string {
\tvar buffer bytes.Buffer
\tif err := html.Render(&buffer, node); err != nil {
\t\treturn ""
\t}
\treturn buffer.String()
}

func attr(node *html.Node, name string) string {
\tfor _, attribute := range node.Attr {
\t\tif attribute.Key == name {
\t\t\treturn clean(attribute.Val)
\t\t}
\t}
\treturn ""
}

func value(node *html.Node, attribute string) string {
\tif node == nil {
\t\treturn ""
\t}
\tif attribute == "text" {
\t\treturn clean(htmlquery.InnerText(node))
\t}
\tif attribute == "html" {
\t\treturn renderHTML(node)
\t}
\treturn attr(node, attribute)
}

func normalize(value string, field Field) string {
\ttext := clean(value)
\tnormalizer := field.Normalizer
\tif normalizer == "" {
\t\tnormalizer = field.Type
\t}
\tnumber := regexp.MustCompile(\`-?\\d[\\d,.]*\`)
\tif normalizer == "number" || normalizer == "count" || normalizer == "comments" {
\t\tmatch := number.FindString(text)
\t\treturn strings.ReplaceAll(match, ",", "")
\t}
\tif normalizer == "price" {
\t\tmatch := strings.ReplaceAll(number.FindString(text), ",", "")
\t\tif strings.Contains(text, "£") {
\t\t\treturn "GBP " + match
\t\t}
\t\tif strings.Contains(text, "$") {
\t\t\treturn "USD " + match
\t\t}
\t\treturn match
\t}
\tif normalizer == "githubOwner" || normalizer == "githubRepo" {
\t\tparts := strings.Split(strings.ReplaceAll(text, " ", ""), "/")
\t\tif normalizer == "githubRepo" && len(parts) > 1 {
\t\t\treturn parts[1]
\t\t}
\t\treturn parts[0]
\t}
\treturn text
}

func main() {
\tfile, err := os.Open("page.html")
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer file.Close()

\tdoc, err := html.Parse(file)
\tif err != nil {
\t\tpanic(err)
\t}

\trows := selectNodes(doc, ${stringLiteral(project.rowSelector)}, ${modeLiteral(project.rowSelectorMode)})
\twriter := csv.NewWriter(os.Stdout)
\tdefer writer.Flush()

\theaders := make([]string, len(fields))
\tfor i, field := range fields {
\t\theaders[i] = field.Name
\t}
\theaders = append(headers, "_psb_app_version", "_psb_schema_version", "_psb_shape", "_psb_source_url")
\t_ = writer.Write(headers)

\tfor _, row := range rows {
\t\trecord := make([]string, 0, len(fields)+4)
\t\tfor i, field := range fields {
\t\t\tmatches := selectNodes(row, field.Selector, field.Mode)
\t\t\tif len(matches) > 0 {
\t\t\t\trecord = append(record, normalize(value(matches[0], field.Attribute), field))
\t\t\t} else {
\t\t\t\trecord = append(record, "")
\t\t\t}
\t\t}
\t\trecord = append(record, appVersion, schemaVersion, inferredShape, sourceURL)
\t\t_ = writer.Write(record)
\t}

\tif err := writer.Error(); err != nil {
\t\tfmt.Fprintln(os.Stderr, err)
\t\tos.Exit(1)
\t}
}
`
