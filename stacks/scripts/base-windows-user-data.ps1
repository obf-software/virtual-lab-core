$ssmKey = $args[0]
$ssmRegion = $args[1]
$password = (Get-SSMParameterValue -Name $ssmKey -Region $ssmRegion).Parameters.Value
$securePass = ConvertTo-SecureString $password -AsPlainText -Force
$username = "developer"
$name = "Developer"
$description = "Developer Account"

New-LocalUser $username -Password $securePass -FullName $name -Description $description
Add-LocalGroupMember -Group "Administrators" -Member $username
Set-LocalUser -Name $username -PasswordNeverExpires 1 -AccountNeverExpires -UserMayChangePassword 0 -Password $securePass