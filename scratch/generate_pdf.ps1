$htmlPath = "c:\laragon\www\smurfit\scratch\informe_smurfit.html"
$pdfWorkspace = "c:\laragon\www\smurfit\scratch\Informe_Evaluacion_RFP_Smurfit_Westrock_Middleware_BioTime.pdf"
$pdfDest = "C:\Users\theig\OneDrive\Documents\Theizer Dev\Innovacion\Smurfit Westrock\Informe_Evaluacion_RFP_Smurfit_Westrock_Middleware_BioTime.pdf"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Output "Generando PDF con Chrome..."
Start-Process -FilePath $chrome -ArgumentList "--headless", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf=$pdfWorkspace", $htmlPath -Wait

if (Test-Path $pdfWorkspace) {
    Copy-Item -Path $pdfWorkspace -Destination $pdfDest -Force
    $size1 = (Get-Item $pdfWorkspace).Length
    $size2 = (Get-Item $pdfDest).Length
    Write-Output "OK - PDF generado exitosamente:"
    Write-Output "1) $pdfWorkspace ($size1 bytes)"
    Write-Output "2) $pdfDest ($size2 bytes)"
} else {
    Write-Error "Error: No se pudo generar el archivo PDF"
}
