$ssmKey = $args[0]
$ssmRegion = $args[1]
$password = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe"  ssm get-parameter --name "$ssmKey" --region "$ssmRegion" --with-decryption --query "Parameter.Value" --output text
$securePass = ConvertTo-SecureString $password -AsPlainText -Force
$username = "developer"
$name = "Developer"
$description = "Developer Account"

New-LocalUser $username -Password $securePass -FullName $name -Description $description
Add-LocalGroupMember -Group "Administrators" -Member $username
Set-LocalUser -Name $username -PasswordNeverExpires 1 -AccountNeverExpires -UserMayChangePassword 0 -Password $securePass