{ pkgs }: {
  deps = [
    pkgs.fetchutils
    pkgs.zip
    pkgs.unzip
    pkgs.imagemagick
    pkgs.jq
    pkgs.nodejs
    pkgs.ffmpeg
  ];
}