import type { FieldRule, ScraperProject, SelectorMode } from './types'

const stringLiteral = (value: string): string => JSON.stringify(value)

const modeLiteral = (mode: SelectorMode): string => stringLiteral(mode)

const pythonFieldList = (fields: FieldRule[]): string =>
  fields
    .map(
      (field) =>
        `{ "name": ${stringLiteral(field.name)}, "selector": ${stringLiteral(field.selector)}, "mode": ${modeLiteral(
          field.selectorMode,
        )}, "attribute": ${stringLiteral(field.attribute)} }`,
    )
    .join(',\n    ')

export const generatePythonScraper = (project: ScraperProject): string => `from pathlib import Path
from parsel import Selector

# pip install parsel
HTML_PATH = "page.html"
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

for row in rows:
    record = {}
    for field in FIELDS:
        record[field["name"]] = extract_value(select(row, field["selector"], field["mode"]), field["attribute"])
    records.append(record)

print(records)
`

const goFieldList = (fields: FieldRule[]): string =>
  fields
    .map(
      (field) =>
        `{Name: ${stringLiteral(field.name)}, Selector: ${stringLiteral(field.selector)}, Mode: ${modeLiteral(
          field.selectorMode,
        )}, Attribute: ${stringLiteral(field.attribute)}}`,
    )
    .join(',\n\t')

export const generateGoScraper = (project: ScraperProject): string => `package main

import (
\t"bytes"
\t"encoding/csv"
\t"fmt"
\t"os"
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
}

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
\t_ = writer.Write(headers)

\tfor _, row := range rows {
\t\trecord := make([]string, len(fields))
\t\tfor i, field := range fields {
\t\t\tmatches := selectNodes(row, field.Selector, field.Mode)
\t\t\tif len(matches) > 0 {
\t\t\t\trecord[i] = value(matches[0], field.Attribute)
\t\t\t}
\t\t}
\t\t_ = writer.Write(record)
\t}

\tif err := writer.Error(); err != nil {
\t\tfmt.Fprintln(os.Stderr, err)
\t\tos.Exit(1)
\t}
}
`
