#!/usr/bin/env perl 
#===============================================================================
#
#         FILE: download.pl
#
#        USAGE: ./download.pl  
#
#  DESCRIPTION: 
#
#      OPTIONS: ---
# REQUIREMENTS: ---
#         BUGS: ---
#        NOTES: ---
#       AUTHOR: YOUR NAME (), 
# ORGANIZATION: 
#      VERSION: 1.0
#      CREATED: 08/03/2015 19:54:40
#     REVISION: ---
#===============================================================================

use strict;
use warnings;
use utf8;
use feature 'say';
use FindBin;
use lib "$FindBin::Bin/../local/lib/perl5";
use Data::Dumper;
use Text::CSV;
use IO::All;
use LWP::Simple qw(getstore);
use LWP::UserAgent;
use Image::Resize;
use LWP::MediaTypes qw(guess_media_type);
use Imager;


my $sill = io->file("$FindBin::Bin/../ui/img/default-m.png")->slurp; 
my @rows;
my $csv = Text::CSV->new ( { binary => 1 } )  # should set binary attribute.
                or die "Cannot use CSV: ".Text::CSV->error_diag ();
 
open my $fh, "<:encoding(utf8)", "$FindBin::Bin/../_data/councillors.csv" or die "councillors.csv: $!";
#while ( my $row = $csv->getline( $fh ) ) {
    #push @rows, $row;
#}
$csv->column_names ($csv->getline ($fh));
my $data = $csv->getline_hr_all ($fh);

$csv->eof or $csv->error_diag();
close $fh;

my $ua = LWP::UserAgent->new();

for my $d ( @$data ) {
    my $url = $d->{'photo'};
    my $file = "$FindBin::Bin/../_fullsize/" . $d->{'id'} . '.jpg';
    my $name = $d->{'id'};
    # save the image
    my $response = $ua->get($url);
    warn $response->status_line if !$response->is_success;
    if ($response->is_success) {
        say "Think I got it...";
        say "Saved to $file";
        getstore($url,$file);
        my $type = guess_media_type($file);
        say $type;
        if ( $type eq 'image/jpeg' ) {
        resize_image($file,$name)
       }
    } else {
        warn "Couldn't get it!";
        say $url;
        say Dumper( $response->status_line );
        $sill > io($file);  
        resize_image($file,$name)
    }
}

sub resize_image {
    my $jpg = shift;
    my $name = shift;
    my $file = $name . '.jpg';
    #my $image = Image::Resize->new($jpg);
    #my $gd = $image->resize(200, 200);
    #$gd->jpeg > io("$FindBin::Bin/../_thumbs/$name-thumb.jpg");  
    my $img = Imager->new(file=>$jpg)
        or die Imager->errstr();
    my $thumb = $img->scale(xpixels => 200, ypixels => 200);
    $thumb = $thumb->crop(top => 0, height => 200);
    $thumb->write(file=>"$FindBin::Bin/../ui/img/thumbs/$file") or
      die $thumb->errstr;
}
