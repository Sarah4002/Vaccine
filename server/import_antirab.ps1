param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-EntryText {
  param(
    [System.IO.Compression.ZipArchive]$Archive,
    [string]$EntryName
  )

  $entry = $Archive.GetEntry($EntryName)
  if (-not $entry) { return $null }

  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  try {
    return $reader.ReadToEnd()
  }
  finally {
    $reader.Dispose()
    $stream.Dispose()
  }
}

function Get-CellValue {
  param(
    $Cell,
    [string[]]$SharedStrings
  )

  if ($Cell.t -eq 'inlineStr') {
    return [string]$Cell.is.t
  }

  $raw = [string]$Cell.v
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return ''
  }

  if ($Cell.t -eq 's') {
    $index = [int]$raw
    if ($index -ge 0 -and $index -lt $SharedStrings.Count) {
      return $SharedStrings[$index]
    }
  }

  return $raw
}

$fileStream = $null
$zip = $null
try {
  $resolvedPath = (Resolve-Path -LiteralPath $WorkbookPath).Path
  $fileStream = [System.IO.File]::Open($resolvedPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  $zip = New-Object System.IO.Compression.ZipArchive($fileStream, [System.IO.Compression.ZipArchiveMode]::Read)

  $workbookXmlText = Read-EntryText -Archive $zip -EntryName 'xl/workbook.xml'
  $relsXmlText = Read-EntryText -Archive $zip -EntryName 'xl/_rels/workbook.xml.rels'
  $sharedXmlText = Read-EntryText -Archive $zip -EntryName 'xl/sharedStrings.xml'

  if (-not $workbookXmlText -or -not $relsXmlText) {
    throw 'Structure XLSX invalide.'
  }

  [xml]$workbookXml = $workbookXmlText
  [xml]$relsXml = $relsXmlText

  $nsWorkbook = New-Object System.Xml.XmlNamespaceManager($workbookXml.NameTable)
  $nsWorkbook.AddNamespace('main', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $nsWorkbook.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

  $nsRels = New-Object System.Xml.XmlNamespaceManager($relsXml.NameTable)
  $nsRels.AddNamespace('rel', 'http://schemas.openxmlformats.org/package/2006/relationships')

  $sharedStrings = @()
  if ($sharedXmlText) {
    [xml]$sharedXml = $sharedXmlText
    foreach ($item in $sharedXml.sst.si) {
      if ($item.t) {
        $sharedStrings += [string]$item.t
      }
      elseif ($item.r) {
        $sharedStrings += (($item.r | ForEach-Object { $_.t }) -join '')
      }
      else {
        $sharedStrings += ''
      }
    }
  }

  $sheetNode = $workbookXml.SelectSingleNode("//main:sheets/main:sheet[@name='ANTIRAB']", $nsWorkbook)
  if (-not $sheetNode) {
    throw 'Feuille ANTIRAB introuvable.'
  }

  $relationId = $sheetNode.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $relNode = $relsXml.SelectSingleNode("//rel:Relationship[@Id='$relationId']", $nsRels)
  if (-not $relNode) {
    throw 'Relation de feuille introuvable.'
  }

  $sheetPath = 'xl/' + $relNode.Target.Replace('\', '/')
  [xml]$sheetXml = Read-EntryText -Archive $zip -EntryName $sheetPath
  if (-not $sheetXml) {
    throw 'Contenu de feuille ANTIRAB introuvable.'
  }

  $wantedHeaders = @{
    'ANNEE' = 'ANNEE'
    'MOIS' = 'MOIS'
    'NOM' = 'NOM'
    'PRENOM' = 'PRENOM'
    'SEXE' = 'SEXE'
    'AGE' = 'AGE'
    'POID' = 'POID'
    'POIDS' = 'POID'
    'ADRESSE' = 'ADRESSE'
    'COMMUNE' = 'COMMUNE'
    'WILAYA' = 'WILAYA'
    'DAIRA' = 'DAIRA'
    'PROF' = 'PROF'
    'PROFESSION' = 'PROF'
    'FONCTION' = 'FONCTION'
    'SERVICE' = 'SERVICE'
    'INSTRUC' = 'INSTRUC'
    'INSTRUCTION' = 'INSTRUC'
    'TEL' = 'TEL'
    'TELEPHONE' = 'TEL'
    'DATMORSURE' = 'DATMORSURE'
    'SIEGE' = 'SIEGE'
    'NATULESI' = 'NATULESI'
    'CLASRISQ' = 'CLASRISQ'
    'MORDEUR' = 'MORDEUR'
    'STATANIM' = 'STATANIM'
    'VACCANIM' = 'VACCANIM'
    'ERIG' = 'ERIG'
    'LOTERIG' = 'LOTERIG'
    'DPERIG' = 'DPÉERIG'
    'VOIADM' = 'VOIADM'
    'TYPVAC' = 'TYPVAC'
    'DCI' = 'DCI'
    'LOTVAR' = 'LOTVAR'
    'DATPEVAR' = 'DATPÉVAR'
    'VARDOSE' = 'VARDOSE'
    'VACCINAT01' = 'VACCINAT01'
    'DATCONS' = 'DATCONS'
    'DATECONS' = 'DATECONS'
    'MPVI' = 'MPVI'
    'MPVI1' = 'MPVI1'
    'DATMPVI' = 'DATMPVI'
    'MESUMPVI' = 'MESUMPVI'
    'OBSERV' = 'OBSERV'
    'OBSERVATION' = 'OBSERVATION'
  }

  $headerMap = @{}
  $rows = New-Object System.Collections.Generic.List[object]

  foreach ($row in $sheetXml.worksheet.sheetData.row) {
    $cells = @($row.c)
    if (-not $cells.Count) { continue }

    if ([int]$row.r -eq 1) {
      foreach ($cell in $cells) {
        $column = ([string]$cell.r) -replace '\d', ''
        $header = [string](Get-CellValue -Cell $cell -SharedStrings $sharedStrings)
        $normalized = ($header.ToLowerInvariant().Normalize([Text.NormalizationForm]::FormD) -replace '[\p{Mn}]', '' -replace '[^a-z0-9]', '').ToUpperInvariant()
        if ($wantedHeaders.ContainsKey($normalized)) {
          $headerMap[$column] = $wantedHeaders[$normalized]
        }
      }
      continue
    }

    $item = [ordered]@{}
    foreach ($cell in $cells) {
      $column = ([string]$cell.r) -replace '\d', ''
      $header = $headerMap[$column]
      if ([string]::IsNullOrWhiteSpace($header)) { continue }
      $item[$header.Trim()] = Get-CellValue -Cell $cell -SharedStrings $sharedStrings
    }

    if ($item.Count -gt 0) {
      $rows.Add([pscustomobject]$item)
    }
  }

  $rows | ConvertTo-Json -Compress -Depth 6
}
finally {
  if ($zip) {
    $zip.Dispose()
  }
  if ($fileStream) {
    $fileStream.Dispose()
  }
}
