; CluDari Inno Setup script (no ISPP macros - works on all Inno Setup 6 installs)

[Setup]
AppId={{A7C3D4E5-8F21-4B6A-9C0D-1E2F3A4B5C6D}
AppName=CluDari
AppVersion=2.1.0
AppPublisher=CluDari
AppPublisherURL=https://github.com/cludari
DefaultDirName={autopf}\CluDari
DefaultGroupName=CluDari
DisableProgramGroupPage=yes
OutputDir=installer_output
OutputBaseFilename=CluDari_Setup_2.1.0
SetupIconFile=icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\CluDari.exe
VersionInfoVersion=2.1.0.0
VersionInfoCompany=CluDari
VersionInfoDescription=CluDari Personal Accounting
VersionInfoProductName=CluDari

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop icon"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
; Onedir PyInstaller output
Source: "dist\CluDari\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Optional extras if present
Source: "VERSION"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "cludari_server.ini"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\CluDari"; Filename: "{app}\CluDari.exe"
Name: "{group}\Uninstall CluDari"; Filename: "{uninstallexe}"
Name: "{autodesktop}\CluDari"; Filename: "{app}\CluDari.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\CluDari.exe"; Description: "Launch CluDari"; Flags: nowait postinstall skipifsilent
